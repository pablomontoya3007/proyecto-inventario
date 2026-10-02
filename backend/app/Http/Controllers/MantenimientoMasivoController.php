<?php

namespace App\Http\Controllers;

use App\Enums\EstadoMantenimiento;
use App\Http\Requests\MantenimientoMasivoRequest;
use App\Models\Equipo;
use App\Models\Mantenimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mantenimiento masivo: programar el mismo mantenimiento (fecha +
 * descripción) para varios equipos de una ubicación a la vez.
 *
 * Se crea UN registro de Mantenimiento por equipo — exactamente igual
 * que si se programaran uno por uno. Por eso, sin hacer nada extra:
 * - cada uno aparece en la hoja de vida de su equipo (relación
 *   mantenimientos, que EquipoController::show() ya carga);
 * - cada uno aparece en la pestaña "Activos" de Mantenimientos;
 * - AuditoriaObserver registra cada creación.
 *
 * Separado de MantenimientoController para que ese controlador siga
 * siendo un CRUD de un solo registro.
 */
class MantenimientoMasivoController extends Controller
{
    /**
     * Todos los equipos de una ubicación, SIN paginar (a diferencia de
     * GET /equipos): el frontend necesita la lista completa para que la
     * persona desmarque los que no requieren mantenimiento.
     *
     * tiene_mantenimiento_activo se calcula con withExists (una sola
     * subconsulta EXISTS por fila, sin cargar los mantenimientos).
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
     * Todo dentro de una transacción: o se programan todos los
     * mantenimientos o ninguno — nunca queda un lote a medias.
     *
     * Se usa Mantenimiento::create() en un ciclo (y no un insert masivo)
     * a propósito: el insert masivo se salta los eventos de Eloquent, y
     * sin ellos AuditoriaObserver no registraría las creaciones.
     *
     * Un equipo que ya tiene un mantenimiento pendiente se OMITE (no se
     * duplica) y se informa en la respuesta, en vez de rechazar el lote
     * completo. El frontend ya los muestra deshabilitados; esta revisión
     * cubre el caso de que alguien haya programado uno entre que se
     * abrió la lista y se envió.
     */
    public function store(MantenimientoMasivoRequest $request): JsonResponse
    {
        $this->authorize('create', Mantenimiento::class);

        $datos = $request->validated();

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

        DB::transaction(function () use ($aProgramar, $datos) {
            foreach ($aProgramar as $equipo) {
                Mantenimiento::create([
                    'equipo_id' => $equipo->id,
                    'fecha_programada' => $datos['fecha_programada'],
                    'descripcion' => $datos['descripcion'] ?? null,
                    'estado' => EstadoMantenimiento::EnEspera,
                ]);
            }
        });

        $creados = $aProgramar->count();

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
        ], $creados > 0 ? 201 : 200);
    }
}