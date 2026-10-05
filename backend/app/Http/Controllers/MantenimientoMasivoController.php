<?php

namespace App\Http\Controllers;

use App\Enums\EstadoMantenimiento;
use App\Http\Requests\MantenimientoMasivoRequest;
use App\Models\Equipo;
use App\Models\Mantenimiento;
use App\Models\User;
use App\Services\EnvioCorreoService;
use App\Support\PlantillasCorreo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mantenimiento masivo: programar el mismo mantenimiento (fecha,
 * descripción y usuario asignado) para varios equipos de una ubicación.
 *
 * Se crea UN registro de Mantenimiento por equipo (así cada uno aparece
 * en la hoja de vida de su equipo y en la pestaña Activos), pero la
 * notificación al usuario asignado es UNA sola, con todos los equipos.
 */
class MantenimientoMasivoController extends Controller
{
    /**
     * Todos los equipos de una ubicación, SIN paginar: el frontend
     * necesita la lista completa para que la persona desmarque los que
     * no requieren mantenimiento.
     */
    public function equipos(Request $request): JsonResponse
    {
        $this->authorize('create', Mantenimiento::class);

        $request->validate([
            'ubicacion_formacion_id' => ['required', 'integer', 'exists:ubicaciones_formacion,id'],
        ]);

        $equipos = Equipo::query()
            ->with('tipoEquipo')
            ->where('ubicacion_formacion_id', $request->integer('ubicacion_formacion_id'))
            ->withExists([
                'mantenimientos as tiene_mantenimiento_activo' => fn ($q) => $q->where('estado', '!=', EstadoMantenimiento::Listo),
            ])
            ->orderBy('placa_sena')
            ->get();

        return response()->json([
            'data' => $equipos->map(fn (Equipo $equipo) => [
                'id' => $equipo->id,
                'placa_sena' => $equipo->placa_sena,
                'serial' => $equipo->serial,
                'tipo_equipo' => $equipo->tipoEquipo?->nombre,
                'estado' => $equipo->estado?->value,
                'estado_label' => $equipo->estado?->label(),
                'tiene_mantenimiento_activo' => (bool) $equipo->tiene_mantenimiento_activo,
            ])->values(),
        ]);
    }

    /**
     * Todo dentro de una transacción: o se programan todos o ninguno.
     * Mantenimiento::create() en un ciclo (no insert masivo) para que
     * AuditoriaObserver registre cada uno.
     *
     * Un equipo con un mantenimiento pendiente se OMITE (no se duplica).
     * La notificación se envía DESPUÉS de la transacción.
     */
    public function store(MantenimientoMasivoRequest $request, EnvioCorreoService $servicioCorreo): JsonResponse
    {
        $this->authorize('create', Mantenimiento::class);

        $datos = $request->validated();
        $asignadoId = $datos['asignado_a'] ?? null;

        // select() ANTES de withExists(): si no, withExists agrega
        // "select *" y luego trae todas las columnas.
        $equipos = Equipo::query()
            ->select(['id', 'placa_sena'])
            ->whereIn('id', $datos['equipo_ids'])
            ->withExists([
                'mantenimientos as tiene_mantenimiento_activo' => fn ($q) => $q->where('estado', '!=', EstadoMantenimiento::Listo),
            ])
            ->get();

        [$conPendiente, $aProgramar] = $equipos->partition(fn (Equipo $equipo) => $equipo->tiene_mantenimiento_activo);

        DB::transaction(function () use ($aProgramar, $datos, $asignadoId) {
            foreach ($aProgramar as $equipo) {
                Mantenimiento::create([
                    'equipo_id' => $equipo->id,
                    'fecha_programada' => $datos['fecha_programada'],
                    'descripcion' => $datos['descripcion'] ?? null,
                    'estado' => EstadoMantenimiento::EnEspera,
                    'asignado_a' => $asignadoId,
                ]);
            }
        });

        $creados = $aProgramar->count();
        $notificaciones = [];
        $asignado = $asignadoId ? User::find($asignadoId) : null;

        if ($creados > 0 && $asignado) {
            $equiposProgramados = Equipo::query()
                ->with(['tipoEquipo', 'ubicacionFormacion.subsede.sede'])
                ->whereIn('id', $aProgramar->pluck('id'))
                ->orderBy('placa_sena')
                ->get();

            [$asunto, $cuerpo] = PlantillasCorreo::mantenimientoAsignado(
                $equiposProgramados,
                $datos['fecha_programada'],
                $datos['descripcion'] ?? null,
                $request->user(),
                $asignado,
            );

            $notificaciones[] = $servicioCorreo->resumen(
                $servicioCorreo->enviar($request->user(), [$asignado->email], $asunto, $cuerpo)
            );
        }

        return response()->json([
            'mensaje' => $creados > 0
                ? "Se programaron {$creados} mantenimiento(s)."
                : 'No se programó ningún mantenimiento.',
            'creados' => $creados,
            'omitidos' => $conPendiente->map(fn (Equipo $equipo) => [
                'equipo_id' => $equipo->id,
                'placa_sena' => $equipo->placa_sena,
                'motivo' => 'Ya tiene un mantenimiento pendiente.',
            ])->values(),
            'notificaciones' => $notificaciones,
        ], $creados > 0 ? 201 : 200);
    }
}