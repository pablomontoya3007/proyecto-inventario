<?php

namespace App\Http\Controllers;

use App\Http\Requests\TrasladoCuentadanteRequest;
use App\Models\Equipo;
use App\Models\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Traslado de cuentadantes: cambiar el cuentadante de uno o varios
 * equipos a otro cuentadante ya registrado.
 *
 * A diferencia de los traslados de UBICACIÓN (TrasladoController), esto
 * NO crea un registro de historial propio: es una simple actualización
 * del campo responsable_id del equipo. Como se guarda con save() (no con
 * un UPDATE masivo), el cambio sí queda en la Auditoría general con el
 * cuentadante anterior y el nuevo, igual que cuando se edita un equipo a
 * mano.
 */
class TrasladoCuentadanteController extends Controller
{
    /** Tope de resultados del selector: suficiente para "todos los de una persona". */
    private const MAX_RESULTADOS = 300;

    /**
     * Equipos para el selector del traslado, SIN paginar (hasta 300), con
     * lo justo para reconocerlos. Filtros opcionales y combinables:
     * - buscar: placa, serial o hostname;
     * - responsable_id: equipos de ese cuentadante (p. ej. todos los de
     *   alguien que se va);
     * - sin_cuentadante=1: equipos sin cuentadante asignado.
     *
     * total: cuántos cumplen el filtro, para avisar si hay más de 300.
     */
    public function equipos(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Equipo::class);

        $consulta = Equipo::query()
            ->when($request->filled('buscar'), function ($q) use ($request) {
                $termino = '%' . $request->input('buscar') . '%';

                // Agrupado en where(fn...): sin el paréntesis, los orWhere
                // se escaparían del filtro de cuentadante.
                $q->where(fn ($sub) => $sub->where('placa_sena', 'like', $termino)
                    ->orWhere('serial', 'like', $termino)
                    ->orWhere('hostname', 'like', $termino));
            })
            ->when($request->filled('responsable_id'), fn ($q) => $q->where('responsable_id', $request->integer('responsable_id')))
            ->when($request->boolean('sin_cuentadante'), fn ($q) => $q->whereNull('responsable_id'));

        $total = (clone $consulta)->count();

        $equipos = $consulta
            ->with(['tipoEquipo', 'responsable', 'ubicacionFormacion.subsede.sede'])
            ->orderBy('placa_sena')
            ->limit(self::MAX_RESULTADOS)
            ->get();

        return response()->json([
            'total' => $total,
            'limite' => self::MAX_RESULTADOS,
            'data' => $equipos->map(fn (Equipo $equipo) => [
                'id' => $equipo->id,
                'placa_sena' => $equipo->placa_sena,
                'serial' => $equipo->serial,
                'tipo_equipo' => $equipo->tipoEquipo?->nombre,
                'ubicacion' => implode(' / ', array_filter([
                    $equipo->ubicacionFormacion?->subsede?->sede?->nombre,
                    $equipo->ubicacionFormacion?->subsede?->nombre,
                    $equipo->ubicacionFormacion?->nombre,
                ])),
                'responsable' => $equipo->responsable
                    ? ['id' => $equipo->responsable->id, 'nombre' => $equipo->responsable->nombre, 'documento' => $equipo->responsable->documento]
                    : null,
            ])->values(),
        ]);
    }

    /**
     * Todo dentro de una transacción: o se actualizan todos o ninguno.
     * Los equipos que YA tenían ese cuentadante no se tocan (se reportan
     * como "sin cambios"), así no se ensucia la auditoría.
     */
    public function store(TrasladoCuentadanteRequest $request): JsonResponse
    {
        $asignaciones = collect($request->validated('asignaciones'))
            ->mapWithKeys(fn ($fila) => [(int) $fila['equipo_id'] => (int) $fila['responsable_id']]);

        $equipos = Equipo::query()->whereIn('id', $asignaciones->keys())->get();

        foreach ($equipos as $equipo) {
            $this->authorize('update', $equipo);
        }

        $nombres = Responsable::query()->whereIn('id', $asignaciones->values()->unique())->pluck('nombre', 'id');

        $actualizados = [];
        $sinCambios = 0;

        DB::transaction(function () use ($equipos, $asignaciones, $nombres, &$actualizados, &$sinCambios) {
            foreach ($equipos as $equipo) {
                $nuevo = $asignaciones[$equipo->id];

                if ((int) $equipo->responsable_id === $nuevo) {
                    $sinCambios++;

                    continue;
                }

                $equipo->responsable_id = $nuevo;
                $equipo->save();

                $actualizados[] = [
                    'equipo_id' => $equipo->id,
                    'placa_sena' => $equipo->placa_sena,
                    'nuevo_cuentadante' => $nombres[$nuevo] ?? null,
                ];
            }
        });

        $cantidad = count($actualizados);

        return response()->json([
            'mensaje' => $cantidad > 0
                ? "Se cambió el cuentadante de {$cantidad} equipo(s)."
                : 'No hubo cambios: los equipos ya tenían ese cuentadante.',
            'actualizados' => $cantidad,
            'sin_cambios' => $sinCambios,
            'detalle' => $actualizados,
        ]);
    }
}