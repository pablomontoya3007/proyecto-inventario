<?php

namespace App\Http\Controllers;

use App\Enums\EstadoEquipo;
use App\Enums\EstadoMantenimiento;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\MantenimientoRequest;
use App\Http\Resources\MantenimientoResource;
use App\Models\Mantenimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MantenimientoController extends Controller
{
    use FiltraPorUbicacion;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Mantenimiento::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $mantenimientos = Mantenimiento::query()
            ->with('equipo')
            ->when($request->filled('completado'), function ($query) use ($request) {
                $completado = filter_var($request->input('completado'), FILTER_VALIDATE_BOOLEAN);

                $completado
                    ? $query->where('estado', EstadoMantenimiento::Listo)
                    : $query->where('estado', '!=', EstadoMantenimiento::Listo);
            })
            ->when(
                $sedeId || $subsedeId || $ubicacionId,
                fn ($q) => $q->whereHas('equipo', fn ($sub) => $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId))
            )
            ->orderBy('fecha_programada')
            ->paginate(15);

        return MantenimientoResource::collection($mantenimientos);
    }

    public function store(MantenimientoRequest $request): JsonResponse
    {
        $this->authorize('create', Mantenimiento::class);

        $mantenimiento = Mantenimiento::create($request->validated());

        return (new MantenimientoResource($mantenimiento->load('equipo')))->response()->setStatusCode(201);
    }

    public function update(MantenimientoRequest $request, Mantenimiento $mantenimiento): MantenimientoResource
    {
        $this->authorize('update', $mantenimiento);

        $mantenimiento->update($request->validated());

        match ($mantenimiento->estado) {
            EstadoMantenimiento::EnMantenimiento => $mantenimiento->equipo->update(['estado' => EstadoEquipo::Mantenimiento]),
            EstadoMantenimiento::Listo => $mantenimiento->equipo->update(['estado' => EstadoEquipo::Activo]),
            EstadoMantenimiento::EnEspera => null,
        };

        return new MantenimientoResource($mantenimiento->load('equipo'));
    }

    public function destroy(Mantenimiento $mantenimiento): JsonResponse
    {
        $this->authorize('delete', $mantenimiento);

        $mantenimiento->delete();

        return response()->json(['mensaje' => 'Mantenimiento eliminado correctamente.']);
    }
}