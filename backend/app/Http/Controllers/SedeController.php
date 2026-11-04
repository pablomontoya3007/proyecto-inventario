<?php

namespace App\Http\Controllers;

use App\Http\Requests\SedeRequest;
use App\Http\Resources\SedeResource;
use App\Models\Sede;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SedeController extends Controller
{
    /**
     * Filtros opcionales: buscar (coincidencia parcial sobre el nombre) e
     * id (coincidencia exacta; lo usan los buscadores para mostrar el
     * nombre de una sede de la que solo se conoce el id).
     * Lo usa el buscador de sedes de los formularios, para poder
     * encontrar una sede aunque no esté entre las primeras 15.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Sede::class);

        // withCount agrega "subsedes_count" con una sola consulta SQL
        // (COUNT vía subquery), sin traer ni serializar cada subsede
        // completa — más barato que ->load('subsedes') para un listado.
        return SedeResource::collection(
            Sede::withCount('subsedes')
                ->when($request->filled('id'), fn ($q) => $q->whereKey($request->integer('id')))
                ->when(
                    $request->filled('buscar'),
                    fn ($q) => $q->where('nombre', 'like', '%' . $request->input('buscar') . '%')
                )
                ->orderBy('nombre')
                ->paginate(15)
        );
    }

    public function store(SedeRequest $request): JsonResponse
    {
        $this->authorize('create', Sede::class);

        $sede = Sede::create($request->validated());

        return (new SedeResource($sede))->response()->setStatusCode(201);
    }

    public function show(Sede $sede): SedeResource
    {
        $this->authorize('view', $sede);

        return new SedeResource($sede->load('subsedes'));
    }

    public function update(SedeRequest $request, Sede $sede): SedeResource
    {
        $this->authorize('update', $sede);

        $sede->update($request->validated());

        return new SedeResource($sede);
    }

    public function destroy(Sede $sede): JsonResponse
    {
        $this->authorize('delete', $sede);

        $sede->delete();

        return response()->json(['mensaje' => 'Sede eliminada correctamente.']);
    }
}