<?php

namespace App\Http\Controllers;

use App\Http\Requests\UbicacionFormacionRequest;
use App\Http\Resources\UbicacionFormacionResource;
use App\Models\UbicacionFormacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UbicacionFormacionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', UbicacionFormacion::class);

        $ubicaciones = UbicacionFormacion::query()
            ->with('subsede.sede')
            ->when($request->filled('subsede_id'), fn ($q) => $q->where('subsede_id', $request->input('subsede_id')))
            ->orderBy('nombre')
            ->paginate(15);

        return UbicacionFormacionResource::collection($ubicaciones);
    }

    public function store(UbicacionFormacionRequest $request): JsonResponse
    {
        $this->authorize('create', UbicacionFormacion::class);

        $ubicacion = UbicacionFormacion::create($request->validated());

        return (new UbicacionFormacionResource($ubicacion))->response()->setStatusCode(201);
    }

    public function show(UbicacionFormacion $ubicacionFormacion): UbicacionFormacionResource
    {
        $this->authorize('view', $ubicacionFormacion);

        return new UbicacionFormacionResource($ubicacionFormacion->load('subsede.sede'));
    }

    public function update(UbicacionFormacionRequest $request, UbicacionFormacion $ubicacionFormacion): UbicacionFormacionResource
    {
        $this->authorize('update', $ubicacionFormacion);

        $ubicacionFormacion->update($request->validated());

        return new UbicacionFormacionResource($ubicacionFormacion);
    }

    public function destroy(UbicacionFormacion $ubicacionFormacion): JsonResponse
    {
        $this->authorize('delete', $ubicacionFormacion);

        $ubicacionFormacion->delete();

        return response()->json(['mensaje' => 'Ubicación eliminada correctamente.']);
    }
}
