<?php

namespace App\Http\Controllers;

use App\Enums\EstadoEquipo;
use App\Enums\EstadoLicencia;
use App\Enums\EstadoMantenimiento;
use App\Enums\EstadoNovedad;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Models\Mantenimiento;
use App\Models\Novedad;
use App\Models\Observacion;
use App\Models\Responsable;
use App\Models\Sede;
use App\Models\Subsede;
use App\Models\UbicacionFormacion;
use Illuminate\Http\JsonResponse;

/**
 * Resumen de todo el sistema para la pantalla de inicio. Endpoint
 * propio (no reutiliza /reportes/*) porque esos devuelven listados
 * completos pensados para exportar a Excel/PDF — pedirlos solo para
 * sacar un número sería mucho más trabajo del que hace falta aquí.
 *
 * Sin Policy dedicada: es un resumen de solo lectura sin un modelo
 * Eloquent propio detrás — la protección es la misma que el resto del
 * sistema, estar autenticado (middleware auth:sanctum de la ruta).
 */
class DashboardController extends Controller
{
    public function resumen(): JsonResponse
    {
        return response()->json([
            'equipos' => [
                'total' => Equipo::count(),
                'activos' => Equipo::where('estado', EstadoEquipo::Activo)->count(),
                'en_mantenimiento' => Equipo::where('estado', EstadoEquipo::Mantenimiento)->count(),
                'en_mal_estado' => Equipo::whereIn('estado', [EstadoEquipo::DeBaja, EstadoEquipo::Extraviado])->count(),
            ],
            'licencias' => [
                'vencidas' => LicenciaOffice::where('estado_licencia', EstadoLicencia::Vencida)->count(),
                'suspendidas' => LicenciaOffice::where('estado_licencia', EstadoLicencia::Suspendida)->count(),
            ],
            // Sin atender = abiertas (aún no resueltas). Sin asignar = abiertas
            // que todavía no tienen a nadie encargado de revisarlas.
            'novedades' => [
                'sin_atender' => Novedad::where('estado', EstadoNovedad::Abierta)->count(),
                'sin_asignar' => Novedad::where('estado', EstadoNovedad::Abierta)->whereNull('asignado_a')->count(),
            ],
            'mantenimientos_pendientes' => Mantenimiento::where('estado', '!=', EstadoMantenimiento::Listo)->count(),
            'responsables_total' => Responsable::count(),
            'estructura' => [
                'sedes' => Sede::count(),
                'subsedes' => Subsede::count(),
                'ubicaciones' => UbicacionFormacion::count(),
            ],
            'ultimas_observaciones' => Observacion::query()
                ->with(['equipo', 'usuario'])
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($observacion) => [
                    'equipo' => $observacion->equipo?->placa_sena ?? 'Sin equipo',
                    'usuario' => $observacion->usuario?->name ?? 'Desconocido',
                    'descripcion' => $observacion->descripcion,
                    'fecha' => $observacion->created_at?->diffForHumans(),
                ]),
            'responsables_top' => Responsable::query()
                ->withCount('equipos')
                ->having('equipos_count', '>', 0)
                ->orderByDesc('equipos_count')
                ->take(5)
                ->get()
                ->map(fn ($responsable) => [
                    'nombre' => $responsable->nombre,
                    'total' => $responsable->equipos_count,
                ]),
        ]);
    }
}