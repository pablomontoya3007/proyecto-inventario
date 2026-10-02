<?php

namespace App\Http\Controllers;

use App\Enums\EstadoCorreo;
use App\Http\Requests\CorreoRequest;
use App\Http\Resources\CorreoEnviadoResource;
use App\Mail\CorreoSistemaMail;
use App\Models\CorreoEnviado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class CorreoController extends Controller
{
    /**
     * Historial. Filtros (opcionales y combinables): asunto,
     * destinatario (dirección dentro de la lista), remitente (nombre de
     * quien lo redactó), estado y fecha_desde/fecha_hasta.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', CorreoEnviado::class);

        $correos = CorreoEnviado::query()
            ->with('remitente')
            ->when($request->filled('asunto'), fn ($q) => $q->where('asunto', 'like', '%' . $request->input('asunto') . '%'))
            // Las direcciones se guardan en minúsculas, así que se busca
            // también en minúsculas (la columna JSON compara sensible a
            // mayúsculas en MySQL).
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
     * Se intenta enviar y, salga bien o mal, se registra en el historial.
     * Por eso siempre responde 201 con el registro: el frontend revisa
     * "estado" para saber si llegó a salir.
     *
     * El detalle técnico del fallo (error) se guarda para diagnóstico;
     * report() además lo deja en storage/logs/laravel.log.
     */
    public function store(CorreoRequest $request): JsonResponse
    {
        $this->authorize('create', CorreoEnviado::class);

        $datos = $request->validated();
        $destinatarios = $request->destinatarios();
        $usuario = $request->user();

        $mensaje = new CorreoSistemaMail(
            asunto: $datos['asunto'],
            cuerpo: $datos['cuerpo'],
            nombreRemitente: $usuario->name,
            correoRemitente: $usuario->email,
        );

        $estado = EstadoCorreo::Enviado;
        $error = null;

        try {
            $this->enviar($mensaje, $destinatarios);
        } catch (Throwable $excepcion) {
            report($excepcion);
            $estado = EstadoCorreo::Fallido;
            $error = Str::limit($excepcion->getMessage(), 1000);
        }

        $correo = CorreoEnviado::create([
            'user_id' => $usuario->id,
            'asunto' => $datos['asunto'],
            'cuerpo' => $datos['cuerpo'],
            'destinatarios' => $destinatarios,
            'estado' => $estado,
            'error' => $error,
        ]);

        return (new CorreoEnviadoResource($correo->load('remitente')))->response()->setStatusCode(201);
    }

    /**
     * Un destinatario: va en "Para".
     * Varios: van en copia oculta (CCO) y el "Para" es la propia cuenta
     * del sistema — así nadie ve las direcciones de los demás, y es un
     * solo envío SMTP aunque sean muchos destinatarios.
     */
    private function enviar(Mailable $mensaje, array $destinatarios): void
    {
        if (count($destinatarios) === 1) {
            Mail::to($destinatarios[0])->send($mensaje);

            return;
        }

        Mail::to(config('mail.from.address'))
            ->bcc($destinatarios)
            ->send($mensaje);
    }
}