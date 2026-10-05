<?php

namespace App\Http\Controllers;

use App\Http\Requests\CorreoRequest;
use App\Http\Resources\CorreoEnviadoResource;
use App\Models\CorreoEnviado;
use App\Services\EnvioCorreoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CorreoController extends Controller
{
    /**
     * Historial (incluye también las notificaciones automáticas de
     * mantenimientos y novedades). Filtros opcionales y combinables:
     * asunto, destinatario, remitente, estado, fecha_desde/fecha_hasta.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', CorreoEnviado::class);

        $correos = CorreoEnviado::query()
            ->with('remitente')
            ->when($request->filled('asunto'), fn ($q) => $q->where('asunto', 'like', '%' . $request->input('asunto') . '%'))
            ->when(
                $request->filled('destinatario'),
                fn ($q) => $q->where('destinatarios', 'like', '%' . mb_strtolower($request->input('destinatario')) . '%')
            )
            ->when(
                $request->filled('remitente'),
                fn ($q) => $q->whereHas('remitente', fn ($s) => $s->where('name', 'like', '%' . $request->input('remitente') . '%'))
            )
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->input('estado')))
            ->when($request->filled('fecha_desde'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('fecha_desde')))
            ->when($request->filled('fecha_hasta'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('fecha_hasta')))
            ->latest()
            ->paginate(15);

        return CorreoEnviadoResource::collection($correos);
    }

    /**
     * Siempre 201 con el registro: el frontend revisa "estado" para saber
     * si el correo llegó a salir. El envío en sí vive en
     * EnvioCorreoService (compartido con las notificaciones).
     */
    public function store(CorreoRequest $request, EnvioCorreoService $servicioCorreo): JsonResponse
    {
        $this->authorize('create', CorreoEnviado::class);

        $datos = $request->validated();

        $correo = $servicioCorreo->enviar(
            $request->user(),
            $request->destinatarios(),
            $datos['asunto'],
            $datos['cuerpo'],
        );

        return (new CorreoEnviadoResource($correo))->response()->setStatusCode(201);
    }
}