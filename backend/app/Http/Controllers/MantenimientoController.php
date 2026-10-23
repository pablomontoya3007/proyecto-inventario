<?php

namespace App\Http\Controllers;

use App\Enums\EstadoEquipo;
use App\Enums\EstadoMantenimiento;
use App\Exports\TablaExport;
use App\Http\Controllers\Concerns\CuentaPorColumna;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\MantenimientoRequest;
use App\Http\Resources\MantenimientoResource;
use App\Models\Mantenimiento;
use App\Services\EnvioCorreoService;
use App\Support\PlantillasCorreo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Maatwebsite\Excel\Facades\Excel;

class MantenimientoController extends Controller
{
    use CuentaPorColumna;
    use FiltraPorUbicacion;

    /**
     * Filtros: completado, estado (en_espera, en_mantenimiento, listo),
     * sede_id/subsede_id/ubicacion_formacion_id y asignado_a.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Mantenimiento::class);

        $mantenimientos = $this->consultaFiltrada($request)
            ->with(['equipo', 'asignado'])
            ->paginate(15);

        return MantenimientoResource::collection($mantenimientos)
            ->additional(['contadores' => [
                // Sin estado ni pestaña (completado): son lo que los
                // contadores eligen. Sí respetan ubicación y "asignados a mí".
                'por_estado' => $this->contarPorColumna(
                    $this->consultaFiltrada($request, ['estado', 'completado']),
                    'estado',
                    EstadoMantenimiento::cases()
                ),
            ]]);
    }

    /**
     * Excel con todos los mantenimientos que cumplen los filtros de la
     * pantalla (incluida la pestaña: completado=1 para el historial).
     * Con ?asignado_a= sirve para hacerle seguimiento a una persona: cada
     * fila trae qué equipo es, dónde está, de quién es, qué hay que hacer
     * (descripción), para cuándo y en qué va.
     */
    public function exportar(Request $request)
    {
        $this->authorize('viewAny', Mantenimiento::class);

        $filas = $this->consultaFiltrada($request)
            ->with(['equipo.tipoEquipo', 'equipo.responsable', 'equipo.ubicacionFormacion.subsede.sede', 'asignado'])
            ->get()
            ->map(fn (Mantenimiento $mantenimiento) => [
                $mantenimiento->equipo?->placa_sena ?? 'Equipo eliminado',
                $mantenimiento->equipo?->tipoEquipo?->nombre ?? '—',
                self::rutaUbicacion($mantenimiento->equipo?->ubicacionFormacion),
                $mantenimiento->equipo?->responsable?->nombre ?? 'Sin cuentadante',
                $mantenimiento->fecha_programada?->format('d/m/Y') ?? '—',
                $mantenimiento->descripcion ?? '—',
                $mantenimiento->estado?->label() ?? '—',
                $mantenimiento->asignado?->name ?? 'Sin asignar',
                $mantenimiento->fecha_completado?->format('d/m/Y') ?? '—',
            ])
            ->all();

        return Excel::download(
            new TablaExport(
                ['Placa SENA', 'Tipo de equipo', 'Ubicación', 'Cuentadante', 'Fecha programada', 'Descripción', 'Estado', 'Asignado a', 'Fecha completado'],
                $filas
            ),
            'mantenimientos.xlsx'
        );
    }

    /**
     * Consulta con todos los filtros, compartida por index() y exportar().
     * $ignorar: filtros que no se aplican (los usan los contadores).
     */
    private function consultaFiltrada(Request $request, array $ignorar = []): Builder
    {
        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        return Mantenimiento::query()
            ->when($request->filled('completado') && !in_array('completado', $ignorar, true), function ($query) use ($request) {
                $completado = filter_var($request->input('completado'), FILTER_VALIDATE_BOOLEAN);

                $completado
                    ? $query->where('estado', EstadoMantenimiento::Listo)
                    : $query->where('estado', '!=', EstadoMantenimiento::Listo);
            })
            ->when(
                $request->filled('estado') && !in_array('estado', $ignorar, true),
                fn ($q) => $q->where('estado', $request->input('estado'))
            )
            ->when(
                $sedeId || $subsedeId || $ubicacionId,
                fn ($q) => $q->whereHas('equipo', fn ($sub) => $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId))
            )
            ->when($request->filled('asignado_a'), fn ($q) => $q->where('asignado_a', $request->integer('asignado_a')))
            ->orderBy('fecha_programada');
    }

    private static function rutaUbicacion($ubicacion): string
    {
        if (!$ubicacion) {
            return '—';
        }

        return implode(' / ', array_filter([
            $ubicacion->subsede?->sede?->nombre,
            $ubicacion->subsede?->nombre,
            $ubicacion->nombre,
        ]));
    }

    /**
     * Si se asignó un usuario, se le notifica DESPUÉS de guardar: si el
     * correo falla, el mantenimiento ya quedó programado igual.
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