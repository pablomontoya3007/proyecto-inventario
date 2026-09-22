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
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Sin Policy dedicada: igual que el resto del sistema, no hay roles
 * distintos — el middleware auth:sanctum de la ruta ya exige estar
 * logueado, que es la única regla que aplicaría.
 */
class ReporteController extends Controller
{
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

    /**
     * Extrae los tres niveles de filtro de ubicación desde la query string,
     * con los mismos nombres de parámetro que ya usa
     * EquipoController::index() (sede_id, subsede_id,
     * ubicacion_formacion_id) — así el frontend reutiliza exactamente la
     * misma lógica de filtros en cascada que ya tiene para Equipos y
     * Ubicaciones, en vez de inventar un esquema nuevo solo para Reportes.
     *
     * @return array{0: ?int, 1: ?int, 2: ?int}
     */
    private function filtrosUbicacion(Request $request): array
    {
        return [
            $request->filled('sede_id') ? (int) $request->input('sede_id') : null,
            $request->filled('subsede_id') ? (int) $request->input('subsede_id') : null,
            $request->filled('ubicacion_formacion_id') ? (int) $request->input('ubicacion_formacion_id') : null,
        ];
    }

    /**
     * Centraliza las consultas para que JSON, Excel y PDF usen siempre
     * los mismos números. Los soft-deletes de Equipo se excluyen
     * automáticamente (scope global de SoftDeletes). Los tres parámetros
     * de ubicación son opcionales: sin ellos, el reporte sigue siendo
     * global, igual que antes.
     */
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

    /**
     * LicenciaOffice no tiene fecha de vencimiento en el esquema (solo
     * fecha_actualizacion, que registra cuándo cambió la contraseña) —
     * así que "por vencer" no se puede calcular de forma predictiva.
     * Se muestra lo que sí hay: conteo por estado, y el listado de las
     * que YA están en Vencida o Suspendida. El filtro de ubicación se
     * aplica a través del equipo dueño de la licencia.
     */
    private function datosLicencias(?int $sedeId, ?int $subsedeId, ?int $ubicacionId): array
    {
        $porEstado = LicenciaOffice::query()
            ->whereHas('equipo', fn ($q) => $q->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId))
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
            ->whereHas('equipo', fn ($q) => $q->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId))
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

    /**
     * Top 10 responsables por cantidad de equipos a cargo. Con filtro de
     * ubicación, el conteo (withCount) solo tiene en cuenta los equipos de
     * esa ubicación — y se descartan los responsables que queden en 0
     * equipos ahí, porque un "0" no aporta nada a un ranking de "los que
     * más tienen" (sin filtro esto casi no se notaba, porque era raro que
     * un responsable no tuviera ningún equipo en todo el sistema).
     */
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