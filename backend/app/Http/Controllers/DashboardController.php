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
use App\Models\User;
use BackedEnum;
use Illuminate\Http\JsonResponse;

/**
 * Resumen de todo el sistema. Lo usan el Inicio y los contadores de la
 * parte superior de cada módulo (Equipos, Licencias, Mantenimientos,
 * Novedades, Usuarios) — una sola petición, compartida en caché por el
 * frontend.
 *
 * "por_estado" usa como claves los valores del enum (activo, vencida,
 * en_espera...), los mismos que usan los filtros de cada página.
 *
 * Las claves antiguas (activos, en_mal_estado, vencidas...) se conservan
 * para no romper nada que aún las use.
 */
class DashboardController extends Controller
{
    public function resumen(): JsonResponse
    {
        $equiposPorEstado = $this->contarPorEstado(Equipo::class, 'estado', EstadoEquipo::cases());
        $licenciasPorEstado = $this->contarPorEstado(LicenciaOffice::class, 'estado_licencia', EstadoLicencia::cases());
        $mantenimientosPorEstado = $this->contarPorEstado(Mantenimiento::class, 'estado', EstadoMantenimiento::cases());

        return response()->json([
            'equipos' => [
                'total' => Equipo::count(),
                'por_estado' => $equiposPorEstado,
                // Equipos en uso (activos o en mantenimiento) sin licencia:
                // los de baja o extraviados no necesitan una.
                'sin_licencia' => Equipo::query()
                    ->doesntHave('licenciaOffice')
                    ->whereNotIn('estado', [EstadoEquipo::DeBaja, EstadoEquipo::Extraviado])
                    ->count(),
                'activos' => $equiposPorEstado[EstadoEquipo::Activo->value],
                'en_mantenimiento' => $equiposPorEstado[EstadoEquipo::Mantenimiento->value],
                'en_mal_estado' => $equiposPorEstado[EstadoEquipo::DeBaja->value] + $equiposPorEstado[EstadoEquipo::Extraviado->value],
            ],
            'licencias' => [
                'total' => LicenciaOffice::count(),
                'por_estado' => $licenciasPorEstado,
                'vencidas' => $licenciasPorEstado[EstadoLicencia::Vencida->value],
                'suspendidas' => $licenciasPorEstado[EstadoLicencia::Suspendida->value],
            ],
            'mantenimientos' => [
                'por_estado' => $mantenimientosPorEstado,
            ],
            'mantenimientos_pendientes' => $mantenimientosPorEstado[EstadoMantenimiento::EnEspera->value]
                + $mantenimientosPorEstado[EstadoMantenimiento::EnMantenimiento->value],
            'novedades' => [
                'sin_atender' => Novedad::where('estado', EstadoNovedad::Abierta)->count(),
                'sin_asignar' => Novedad::where('estado', EstadoNovedad::Abierta)->whereNull('asignado_a')->count(),
                'resueltas' => Novedad::where('estado', EstadoNovedad::Resuelta)->count(),
            ],
            'usuarios_total' => User::count(),
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

    /**
     * Un solo GROUP BY por tabla en vez de un COUNT por estado.
     * toBase(): devuelve el estado "crudo" (texto) en vez del enum, para
     * poder usarlo como clave; conserva los scopes globales (soft delete).
     * Los estados sin registros aparecen con 0.
     *
     * @param  class-string  $modelo
     * @param  BackedEnum[]  $casos
     * @return array<string, int>
     */
    private function contarPorEstado(string $modelo, string $columna, array $casos): array
    {
        $conteos = $modelo::query()
            ->toBase()
            ->selectRaw("{$columna} as estado, COUNT(*) as total")
            ->groupBy($columna)
            ->pluck('total', 'estado');

        return collect($casos)
            ->mapWithKeys(fn (BackedEnum $caso) => [$caso->value => (int) ($conteos[$caso->value] ?? 0)])
            ->all();
    }
}