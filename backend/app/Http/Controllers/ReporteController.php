<?php

namespace App\Http\Controllers;

use App\Exports\EquiposPorCategoriaExport;
use App\Models\Equipo;
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

    /**
     * Centraliza las tres consultas para que JSON, Excel y PDF usen
     * exactamente los mismos números — nunca deberían poder
     * desincronizarse entre sí al agregar un cuarto formato de salida.
     *
     * Los soft-deletes de Equipo se excluyen automáticamente (scope
     * global de SoftDeletes) — un equipo dado de baja lógicamente no
     * debería contarse en un reporte de inventario actual.
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
}