<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\ResponsableRequest;
use App\Http\Resources\ResponsableResource;
use App\Models\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ResponsableController extends Controller
{
    use FiltraPorUbicacion;

    /**
     * Un responsable "cae" en el filtro de ubicación si tiene al menos
     * un equipo en esa sede/subsede/ubicación — a diferencia de Equipo,
     * un Responsable no tiene una ubicación propia, la hereda de sus
     * equipos. El whereHas solo se agrega si hay algún filtro activo,
     * para no excluir del listado general a los responsables que
     * todavía no tienen equipos asignados.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Responsable::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $responsables = Responsable::query()
            ->when($request->filled('nombre'), fn ($q) => $q->where('nombre', 'like', '%' . $request->input('nombre') . '%'))
            ->when(
                $sedeId || $subsedeId || $ubicacionId,
                fn ($q) => $q->whereHas('equipos', fn ($sub) => $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId))
            )
            ->orderBy('nombre')
            ->paginate(15);

        return ResponsableResource::collection($responsables);
    }

    public function store(ResponsableRequest $request): JsonResponse
    {
        $this->authorize('create', Responsable::class);

        $responsable = Responsable::create($request->validated());

        return (new ResponsableResource($responsable))->response()->setStatusCode(201);
    }

    public function show(Responsable $responsable): ResponsableResource
    {
        $this->authorize('view', $responsable);

        return new ResponsableResource($responsable);
    }

    public function update(ResponsableRequest $request, Responsable $responsable): ResponsableResource
    {
        $this->authorize('update', $responsable);

        $responsable->update($request->validated());

        return new ResponsableResource($responsable);
    }

    public function destroy(Responsable $responsable): JsonResponse
    {
        $this->authorize('delete', $responsable);

        $responsable->delete();

        return response()->json(['mensaje' => 'Responsable eliminado correctamente.']);
    }
}