<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubsedeRequest;
use App\Http\Resources\SubsedeResource;
use App\Models\Subsede;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubsedeController extends Controller
{
    /**
     * Filtros: sede_id e id — opcionales y combinables. El id es
     * coincidencia EXACTA (whereKey), no LIKE: buscar "1" no debe traer
     * también la 10, 11, 100... Un valor no numérico se convierte en 0
     * con integer(), así que simplemente no encuentra nada.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Subsede::class);

        $subsedes = Subsede::query()
            ->with('sede')
            // Mismo ajuste que en SedeController: withCount en vez de
            // cargar cada ubicación completa solo para contarlas.
            ->withCount('ubicacionesFormacion')
            ->when($request->filled('sede_id'), fn ($q) => $q->where('sede_id', $request->input('sede_id')))
            ->when($request->filled('id'), fn ($q) => $q->whereKey($request->integer('id')))
            ->orderBy('nombre')
            ->paginate(15);

        return SubsedeResource::collection($subsedes);
    }

    public function store(SubsedeRequest $request): JsonResponse
    {
        $this->authorize('create', Subsede::class);

        $subsede = Subsede::create($request->validated());

        return (new SubsedeResource($subsede))->response()->setStatusCode(201);
    }

    public function show(Subsede $subsede): SubsedeResource
    {
        $this->authorize('view', $subsede);

        return new SubsedeResource($subsede->load(['sede', 'ubicacionesFormacion']));
    }

    public function update(SubsedeRequest $request, Subsede $subsede): SubsedeResource
    {
        $this->authorize('update', $subsede);

        $subsede->update($request->validated());

        return new SubsedeResource($subsede);
    }

    public function destroy(Subsede $subsede): JsonResponse
    {
        $this->authorize('delete', $subsede);

        $subsede->delete();

        return response()->json(['mensaje' => 'Subsede eliminada correctamente.']);
    }
}