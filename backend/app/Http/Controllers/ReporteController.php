<?php

namespace App\Http\Controllers;

use App\Enums\EstadoLicencia;
use App\Exports\EquiposPorCategoriaExport;
use App\Exports\LicenciasExport;
use App\Exports\ResponsablesExport;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Models\Responsable;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Sin Policy dedicada: igual que el resto del sistema, no hay roles
 * distintos — el middleware auth:sanctum de la ruta ya exige estar
 * logueado, que es la única regla que aplicaría.
 */
class ReporteController extends Controller
{
    public function equipos(): JsonResponse
    {
        return response()->json($this->datosEquipos());
    }

    public function equiposExcel()
    {
        return Excel::download(new EquiposPorCategoriaExport($this->datosEquipos()), 'equipos-por-categoria.xlsx');
    }

    public function equiposPdf()
    {
        return Pdf::loadView('reportes.equipos', $this->datosEquipos())->download('equipos-por-categoria.pdf');
    }

    public function licencias(): JsonResponse
    {
        return response()->json($this->datosLicencias());
    }

    public function licenciasExcel()
    {
        return Excel::download(new LicenciasExport($this->datosLicencias()), 'licencias.xlsx');
    }

    public function licenciasPdf()
    {
        return Pdf::loadView('reportes.licencias', $this->datosLicencias())->download('licencias.pdf');
    }

    public function responsables(): JsonResponse
    {
        return response()->json(['top' => $this->datosResponsables()]);
    }

    public function responsablesExcel()
    {
        return Excel::download(new ResponsablesExport($this->datosResponsables()), 'responsables.xlsx');
    }

    public function responsablesPdf()
    {
        return Pdf::loadView('reportes.responsables', ['top' => $this->datosResponsables()])
            ->download('responsables.pdf');
    }

    /**
     * Centraliza las consultas para que JSON, Excel y PDF usen siempre
     * los mismos números. Los soft-deletes de Equipo se excluyen
     * automáticamente (scope global de SoftDeletes).
     */
    private function datosEquipos(): array
    {
        $porSede = Equipo::query()
            ->join('ubicaciones_formacion', 'equipos.ubicacion_formacion_id', '=', 'ubicaciones_formacion.id')
            ->join('subsedes', 'ubicaciones_formacion.subsede_id', '=', 'subsedes.id')
            ->join('sedes', 'subsedes.sede_id', '=', 'sedes.id')
            ->select('sedes.nombre')
            ->selectRaw('count(*) as total')
            ->groupBy('sedes.id', 'sedes.nombre')
            ->orderByDesc('total')
            ->get();

        $porTipo = Equipo::query()
            ->join('tipos_equipo', 'equipos.tipo_equipo_id', '=', 'tipos_equipo.id')
            ->select('tipos_equipo.nombre')
            ->selectRaw('count(*) as total')
            ->groupBy('tipos_equipo.id', 'tipos_equipo.nombre')
            ->orderByDesc('total')
            ->get();

        $porEstado = Equipo::query()
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

    /**
     * LicenciaOffice no tiene fecha de vencimiento en el esquema (solo
     * fecha_actualizacion, que registra cuándo cambió la contraseña) —
     * así que "por vencer" no se puede calcular de forma predictiva.
     * Se muestra lo que sí hay: conteo por estado, y el listado de las
     * que YA están en Vencida o Suspendida.
     */
    private function datosLicencias(): array
    {
        $porEstado = LicenciaOffice::query()
            ->select('estado_licencia')
            ->selectRaw('count(*) as total')
            ->groupBy('estado_licencia')
            ->get()
            ->map(fn ($fila) => [
                'estado' => $fila->estado_licencia?->label() ?? 'Sin estado',
                'total' => $fila->total,
            ]);

        $requierenAtencion = LicenciaOffice::query()
            ->with('equipo')
            ->whereIn('estado_licencia', [EstadoLicencia::Vencida, EstadoLicencia::Suspendida])
            ->get()
            ->map(fn ($licencia) => [
                'equipo' => $licencia->equipo?->placa_sena ?? 'Sin equipo',
                'correo' => $licencia->correo,
                'estado' => $licencia->estado_licencia->label(),
                'fecha_actualizacion' => $licencia->fecha_actualizacion?->toDateString(),
            ]);

        return [
            'por_estado' => $porEstado,
            'requieren_atencion' => $requierenAtencion,
        ];
    }

    private function datosResponsables(): array
    {
        return Responsable::query()
            ->withCount('equipos')
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