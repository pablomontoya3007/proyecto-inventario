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
     * Filtros (todos opcionales y combinables):
     * - nombre / documento: cada uno sobre su propia columna (los usa la
     *   página de Responsables, con dos campos de búsqueda separados).
     * - buscar: un solo término que coincide con nombre O documento — lo
     *   usa el buscador de responsables del módulo de equipos, donde la
     *   persona puede conocer la cédula y no el nombre exacto.
     * - sede_id / subsede_id / ubicacion_formacion_id: responsables con
     *   al menos un equipo en esa ubicación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Responsable::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $responsables = Responsable::query()
            ->when($request->filled('nombre'), fn ($q) => $q->where('nombre', 'like', '%' . $request->input('nombre') . '%'))
            ->when($request->filled('documento'), fn ($q) => $q->where('documento', 'like', '%' . $request->input('documento') . '%'))
            // Agrupado en un where(fn...) a propósito: sin el paréntesis,
            // el orWhere se "escaparía" de los demás filtros y devolvería
            // responsables de cualquier ubicación.
            ->when($request->filled('buscar'), function ($q) use ($request) {
                $termino = '%' . $request->input('buscar') . '%';

                $q->where(fn ($sub) => $sub->where('nombre', 'like', $termino)
                    ->orWhere('documento', 'like', $termino));
            })
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