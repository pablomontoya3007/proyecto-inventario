<?php

namespace App\Http\Controllers;

use App\Http\Requests\ObservacionRequest;
use App\Http\Resources\ObservacionResource;
use App\Models\Observacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ObservacionController extends Controller
{
    /**
     * Sin métodos update/destroy en esta clase, y sin rutas para ellos en
     * routes/api.php: la inmutabilidad de las observaciones queda
     * protegida en capas — el modelo (excepción), la Policy (403 antes de
     * llegar aquí) y, ahora, ni siquiera la ruta existe para intentarlo.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Observacion::class);

        $observaciones = Observacion::query()
            ->with(['equipo', 'usuario'])
            ->when($request->filled('equipo_id'), fn ($q) => $q->where('equipo_id', $request->input('equipo_id')))
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
