<?php

namespace App\Http\Controllers;

use App\Http\Requests\TipoEquipoRequest;
use App\Http\Resources\TipoEquipoResource;
use App\Models\TipoEquipo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TipoEquipoController extends Controller
{
    // Sin paginar a propósito: son 8 valores fijos, pensado para llenar un
    // <select> del frontend de una sola vez, no una lista para recorrer.
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TipoEquipo::class);

        return TipoEquipoResource::collection(TipoEquipo::orderBy('nombre')->get());
    }

    public function store(TipoEquipoRequest $request): JsonResponse
    {
        $this->authorize('create', TipoEquipo::class);

        $tipoEquipo = TipoEquipo::create($request->validated());

        return (new TipoEquipoResource($tipoEquipo))->response()->setStatusCode(201);
    }

    public function show(TipoEquipo $tipoEquipo): TipoEquipoResource
    {
        $this->authorize('view', $tipoEquipo);

        return new TipoEquipoResource($tipoEquipo);
    }

    public function update(TipoEquipoRequest $request, TipoEquipo $tipoEquipo): TipoEquipoResource
    {
        $this->authorize('update', $tipoEquipo);

        $tipoEquipo->update($request->validated());

        return new TipoEquipoResource($tipoEquipo);
    }

    public function destroy(TipoEquipo $tipoEquipo): JsonResponse
    {
        $this->authorize('delete', $tipoEquipo);

        $tipoEquipo->delete();

        return response()->json(['mensaje' => 'Tipo de equipo eliminado correctamente.']);
    }
}
