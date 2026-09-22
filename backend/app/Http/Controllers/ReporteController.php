<?php

namespace App\Http\Controllers;

use App\Enums\EstadoLicencia;
use App\Exports\EquiposPorCategoriaExport;
use App\Exports\LicenciasExport;
use App\Exports\ResponsablesExport;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Models\Responsable;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Sin Policy dedicada: igual que el resto del sistema, no hay roles
 * distintos — el middleware auth:sanctum de la ruta ya exige estar
 * logueado, que es la única regla que aplicaría.
 */
class ReporteController extends Controller
{
    use FiltraPorUbicacion;

    public function equipos(Request $request): JsonResponse
    {
        return response()->json($this->datosEquipos(...$this->filtrosUbicacion($request)));
    }

    public function equiposExcel(Request $request)
    {
        $datos = $this->datosEquipos(...$this->filtrosUbicacion($request));

        return Excel::download(new EquiposPorCategoriaExport($datos), 'equipos-por-categoria.xlsx');
    }

    public function equiposPdf(Request $request)
    {
        $datos = $this->datosEquipos(...$this->filtrosUbicacion($request));

        return Pdf::loadView('reportes.equipos', $datos)->download('equipos-por-categoria.pdf');
    }

    public function licencias(Request $request): JsonResponse
    {
        return response()->json($this->datosLicencias(...$this->filtrosUbicacion($request)));
    }

    public function licenciasExcel(Request $request)
    {
        $datos = $this->datosLicencias(...$this->filtrosUbicacion($request));

        return Excel::download(new LicenciasExport($datos), 'licencias.xlsx');
    }

    public function licenciasPdf(Request $request)
    {
        $datos = $this->datosLicencias(...$this->filtrosUbicacion($request));

        return Pdf::loadView('reportes.licencias', $datos)->download('licencias.pdf');
    }

    public function responsables(Request $request): JsonResponse
    {
        return response()->json(['top' => $this->datosResponsables(...$this->filtrosUbicacion($request))]);
    }

    public function responsablesExcel(Request $request)
    {
        $top = $this->datosResponsables(...$this->filtrosUbicacion($request));

        return Excel::download(new ResponsablesExport($top), 'responsables.xlsx');
    }

    public function responsablesPdf(Request $request)
    {
        $top = $this->datosResponsables(...$this->filtrosUbicacion($request));

        return Pdf::loadView('reportes.responsables', ['top' => $top])
            ->download('responsables.pdf');
    }

    private function datosEquipos(?int $sedeId, ?int $subsedeId, ?int $ubicacionId): array
    {
        $porSede = Equipo::query()
            ->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
            ->join('ubicaciones_formacion', 'equipos.ubicacion_formacion_id', '=', 'ubicaciones_formacion.id')
            ->join('subsedes', 'ubicaciones_formacion.subsede_id', '=', 'subsedes.id')
            ->join('sedes', 'subsedes.sede_id', '=', 'sedes.id')
            ->select('sedes.nombre')
            ->selectRaw('count(*) as total')
            ->groupBy('sedes.id', 'sedes.nombre')
            ->orderByDesc('total')
            ->get();

        $porTipo = Equipo::query()
            ->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
            ->join('tipos_equipo', 'equipos.tipo_equipo_id', '=', 'tipos_equipo.id')
            ->select('tipos_equipo.nombre')
            ->selectRaw('count(*) as total')
            ->groupBy('tipos_equipo.id', 'tipos_equipo.nombre')
            ->orderByDesc('total')
            ->get();

        $porEstado = Equipo::query()
            ->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
            ->select('estado')
            ->selectRaw('count(*) as total')
            ->groupBy('estado')
            ->get()
            ->map(fn ($fila) => [
                'estado' => $fila->estado?->label() ?? 'Sin estado',
                'total' => $fila->total,
            ]);

        return [
            'por_sede' => $porSede,
            'por_tipo' => $porTipo,
            'por_estado' => $porEstado,
        ];
    }

    private function licenciasFiltradas(?int $sedeId, ?int $subsedeId, ?int $ubicacionId): Builder
    {
        return LicenciaOffice::query()
            ->when(
                $sedeId || $subsedeId || $ubicacionId,
                fn (Builder $q) => $q->whereHas(
                    'equipo',
                    fn (Builder $sub) => $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
                )
            );
    }

    private function datosLicencias(?int $sedeId, ?int $subsedeId, ?int $ubicacionId): array
    {
        $porEstado = $this->licenciasFiltradas($sedeId, $subsedeId, $ubicacionId)
            ->select('estado_licencia')
            ->selectRaw('count(*) as total')
            ->groupBy('estado_licencia')
            ->get()
            ->map(fn ($fila) => [
                'estado' => $fila->estado_licencia?->label() ?? 'Sin estado',
                'total' => $fila->total,
            ]);

        $requierenAtencion = $this->licenciasFiltradas($sedeId, $subsedeId, $ubicacionId)
            ->with('equipo')
            ->whereIn('estado_licencia', [EstadoLicencia::Vencida, EstadoLicencia::Suspendida])
            ->get()
            ->map(fn ($licencia) => [
                'equipo' => $licencia->equipo?->placa_sena ?? 'Sin equipo',
                'correo' => $licencia->correo,
                'estado' => $licencia->estado_licencia->label(),
                'fecha_actualizacion' => $licencia->fecha_actualizacion?->toDateString(),
            ]);

        $listadoCompleto = $this->licenciasFiltradas($sedeId, $subsedeId, $ubicacionId)
            ->with('equipo.ubicacionFormacion.subsede.sede')
            ->orderBy('correo')
            ->get()
            ->map(fn ($licencia) => [
                'equipo' => $licencia->equipo?->placa_sena ?? 'Sin equipo',
                'sede' => $licencia->equipo?->ubicacionFormacion?->subsede?->sede?->nombre ?? 'Sin sede',
                'subsede' => $licencia->equipo?->ubicacionFormacion?->subsede?->nombre ?? 'Sin subsede',
                'ubicacion' => $licencia->equipo?->ubicacionFormacion?->nombre ?? 'Sin ubicación',
                'correo' => $licencia->correo,
                'estado' => $licencia->estado_licencia?->label() ?? 'Sin estado',
                'fecha_actualizacion' => $licencia->fecha_actualizacion?->toDateString(),
            ]);

        return [
            'por_estado' => $porEstado,
            'requieren_atencion' => $requierenAtencion,
            'listado_completo' => $listadoCompleto,
        ];
    }

    private function datosResponsables(?int $sedeId, ?int $subsedeId, ?int $ubicacionId): array
    {
        return Responsable::query()
            ->withCount(['equipos' => fn ($q) => $q->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)])
            ->having('equipos_count', '>', 0)
            ->orderByDesc('equipos_count')
            ->take(10)
            ->get()
            ->map(fn ($responsable) => [
                'nombre' => $responsable->nombre,
                'total' => $responsable->equipos_count,
            ])
            ->toArray();
    }
}