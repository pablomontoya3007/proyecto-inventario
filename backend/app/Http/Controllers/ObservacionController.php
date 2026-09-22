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

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Observacion::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $observaciones = Observacion::query()
            ->with(['equipo', 'usuario'])
            ->when($request->filled('equipo_id'), fn ($q) => $q->where('equipo_id', $request->input('equipo_id')))
            ->when(
                $sedeId || $subsedeId || $ubicacionId,
                fn ($q) => $q->whereHas('equipo', fn ($sub) => $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId))
            )
            ->latest()
            ->paginate(15);

        return ObservacionResource::collection($observaciones);
    }

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