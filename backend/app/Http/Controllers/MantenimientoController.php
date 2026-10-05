<?php

namespace App\Http\Controllers;

use App\Enums\EstadoEquipo;
use App\Enums\EstadoMantenimiento;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\MantenimientoRequest;
use App\Http\Resources\MantenimientoResource;
use App\Models\Mantenimiento;
use App\Services\EnvioCorreoService;
use App\Support\PlantillasCorreo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MantenimientoController extends Controller
{
    use FiltraPorUbicacion;

    /**
     * Filtros: completado, sede_id/subsede_id/ubicacion_formacion_id y
     * asignado_a (usuario encargado — "solo los míos" en el frontend).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Mantenimiento::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $mantenimientos = Mantenimiento::query()
            ->with(['equipo', 'asignado'])
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
            ->when($request->filled('asignado_a'), fn ($q) => $q->where('asignado_a', $request->integer('asignado_a')))
            ->orderBy('fecha_programada')
            ->paginate(15);

        return MantenimientoResource::collection($mantenimientos);
    }

    /**
     * Si se asignó un usuario, se le notifica DESPUÉS de guardar: si el
     * correo falla, el mantenimiento ya quedó programado igual.
     * "notificaciones" es una lista (vacía si no hay a quién notificar).
     */
    public function store(MantenimientoRequest $request, EnvioCorreoService $servicioCorreo): JsonResponse
    {
        $this->authorize('create', Mantenimiento::class);

        $mantenimiento = Mantenimiento::create($request->validated());
        $mantenimiento->load(['equipo.tipoEquipo', 'equipo.ubicacionFormacion.subsede.sede', 'asignado']);

        $notificaciones = [];

        if ($mantenimiento->asignado) {
            [$asunto, $cuerpo] = PlantillasCorreo::mantenimientoAsignado(
                collect([$mantenimiento->equipo]),
                $mantenimiento->fecha_programada->toDateString(),
                $mantenimiento->descripcion,
                $request->user(),
                $mantenimiento->asignado,
            );

            $notificaciones[] = $servicioCorreo->resumen(
                $servicioCorreo->enviar($request->user(), [$mantenimiento->asignado->email], $asunto, $cuerpo)
            );
        }

        return (new MantenimientoResource($mantenimiento))
            ->additional(['notificaciones' => $notificaciones])
            ->response()
            ->setStatusCode(201);
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

        return new MantenimientoResource($mantenimiento->load(['equipo', 'asignado']));
    }

    public function destroy(Mantenimiento $mantenimiento): JsonResponse
    {
        $this->authorize('delete', $mantenimiento);

        $mantenimiento->delete();

        return response()->json(['mensaje' => 'Mantenimiento eliminado correctamente.']);
    }
}