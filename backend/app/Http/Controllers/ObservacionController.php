<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\ObservacionRequest;
use App\Http\Resources\ObservacionResource;
use App\Models\Observacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ObservacionController extends Controller
{
    use FiltraPorUbicacion;

    /**
     * Filtros disponibles: sede_id/subsede_id/ubicacion_formacion_id +
     * placa_sena (ambos sobre el equipo dueño, comparten un solo
     * whereHas), y usuario (nombre de quien registró la observación,
     * sobre la relación usuario() — columna real "name", aunque el
     * frontend y el Resource la llamen "nombre"/"usuario").
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Observacion::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $observaciones = Observacion::query()
            ->with(['equipo', 'usuario'])
            ->when(
                $sedeId || $subsedeId || $ubicacionId || $request->filled('placa_sena'),
                fn ($q) => $q->whereHas('equipo', function ($sub) use ($sedeId, $subsedeId, $ubicacionId, $request) {
                    $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
                        ->when(
                            $request->filled('placa_sena'),
                            fn ($s) => $s->where('placa_sena', 'like', '%' . $request->input('placa_sena') . '%')
                        );
                })
            )
            ->when(
                $request->filled('usuario'),
                fn ($q) => $q->whereHas('usuario', fn ($s) => $s->where('name', 'like', '%' . $request->input('usuario') . '%'))
            )
            ->latest()
            ->paginate(15);

        return ObservacionResource::collection($observaciones);
    }

    /**
     * user_id nunca sale del body de la petición (ver ObservacionRequest,
     * que a propósito no lo valida): siempre es el usuario autenticado
     * detrás del token con el que se hizo esta petición.
     */
    public function store(ObservacionRequest $request): JsonResponse
    {
        $this->authorize('create', Observacion::class);

        $observacion = Observacion::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return (new ObservacionResource($observacion->load('usuario')))->response()->setStatusCode(201);
    }

    public function show(Observacion $observacion): ObservacionResource
    {
        $this->authorize('view', $observacion);

        return new ObservacionResource($observacion->load(['equipo', 'usuario']));
    }
}