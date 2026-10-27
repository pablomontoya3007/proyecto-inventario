<?php

namespace App\Http\Controllers;

use App\Enums\EstadoNovedad;
use App\Http\Requests\NovedadMasivaRequest;
use App\Models\Equipo;
use App\Models\Novedad;
use App\Models\User;
use App\Services\EnvioCorreoService;
use App\Support\PlantillasCorreo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Novedad masiva: registrar la MISMA novedad (descripción y usuario
 * asignado) en varios equipos de un ambiente.
 *
 * Se crea UNA Novedad por equipo (así cada una aparece en la hoja de vida
 * de su equipo, en el indicador de Equipos y se resuelve por separado),
 * pero los correos se agrupan:
 * - el usuario asignado recibe UN solo correo con todos los equipos;
 * - cada cuentadante recibe UN correo con SUS equipos (si en el ambiente
 *   hay equipos de 3 cuentadantes, salen 3 correos, no uno por equipo).
 *
 * La novedad individual (NovedadController::store) sigue igual.
 */
class NovedadMasivaController extends Controller
{
    /**
     * Todos los equipos de una ubicación, SIN paginar, para marcar en
     * cuáles se presenta la novedad. Trae el cuentadante (para avisar
     * antes de guardar a quién le llegará correo) y cuántas novedades
     * abiertas tiene ya cada equipo (solo informativo: no bloquea).
     */
    public function equipos(Request $request): JsonResponse
    {
        $this->authorize('create', Novedad::class);

        $request->validate([
            'ubicacion_formacion_id' => ['required', 'integer', 'exists:ubicaciones_formacion,id'],
        ]);

        $equipos = Equipo::query()
            ->with(['tipoEquipo', 'responsable'])
            ->where('ubicacion_formacion_id', $request->integer('ubicacion_formacion_id'))
            ->withCount([
                'novedades as novedades_abiertas_count' => fn ($q) => $q->where('estado', EstadoNovedad::Abierta),
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
                'novedades_abiertas_count' => (int) $equipo->novedades_abiertas_count,
                'responsable' => $equipo->responsable
                    ? ['id' => $equipo->responsable->id, 'nombre' => $equipo->responsable->nombre, 'correo' => $equipo->responsable->correo]
                    : null,
            ])->values(),
        ]);
    }

    /**
     * Todo dentro de una transacción: o se registran todas o ninguna.
     * Novedad::create() en un ciclo (no insert masivo) para que
     * AuditoriaObserver registre cada una. Los correos se envían DESPUÉS
     * de la transacción: si uno falla, las novedades quedan registradas.
     */
    public function store(NovedadMasivaRequest $request, EnvioCorreoService $servicioCorreo): JsonResponse
    {
        $this->authorize('create', Novedad::class);

        $datos = $request->validated();
        $reportadoPor = $request->user();
        $asignado = !empty($datos['asignado_a']) ? User::find($datos['asignado_a']) : null;

        $equipos = Equipo::query()
            ->with(['tipoEquipo', 'responsable', 'ubicacionFormacion.subsede.sede'])
            ->whereIn('id', $datos['equipo_ids'])
            ->orderBy('placa_sena')
            ->get();

        DB::transaction(function () use ($equipos, $datos, $reportadoPor, $asignado) {
            foreach ($equipos as $equipo) {
                Novedad::create([
                    'equipo_id' => $equipo->id,
                    'user_id' => $reportadoPor->id,
                    'descripcion' => $datos['descripcion'],
                    'estado' => EstadoNovedad::Abierta,
                    'asignado_a' => $asignado?->id,
                ]);
            }
        });

        $notificaciones = $this->notificar($servicioCorreo, $equipos, $datos['descripcion'], $reportadoPor, $asignado);
        $creadas = $equipos->count();

        return response()->json([
            'mensaje' => "Se registró la novedad en {$creadas} equipo(s).",
            'creadas' => $creadas,
            'notificaciones' => $notificaciones,
        ], 201);
    }

    /**
     * Un correo al usuario asignado (todos los equipos) y uno por
     * cuentadante (solo sus equipos). Si el cuentadante tiene el mismo
     * correo que el usuario asignado, solo se envía el de asignación,
     * igual que en la novedad individual.
     */
    private function notificar(
        EnvioCorreoService $servicioCorreo,
        $equipos,
        string $descripcion,
        User $reportadoPor,
        ?User $asignado
    ): array {
        $notificaciones = [];
        $correoAsignado = $asignado ? mb_strtolower($asignado->email) : null;

        // Primero el usuario asignado: un solo correo con todos los equipos.
        if ($asignado) {
            [$asunto, $cuerpo] = PlantillasCorreo::novedadMasivaAsignada($equipos, $descripcion, $reportadoPor, $asignado);
            $notificaciones[] = $servicioCorreo->resumen(
                $servicioCorreo->enviar($reportadoPor, [$asignado->email], $asunto, $cuerpo)
            );
        }

        // Cuentadantes: un correo por persona con sus equipos.
        $sinCuentadante = $equipos->filter(fn (Equipo $equipo) => !$equipo->responsable);
        $sinCorreo = $equipos->filter(fn (Equipo $equipo) => $equipo->responsable && !$equipo->responsable->correo);
        $conCorreo = $equipos
            ->filter(fn (Equipo $equipo) => $equipo->responsable?->correo)
            ->groupBy(fn (Equipo $equipo) => $equipo->responsable->id);

        foreach ($conCorreo as $equiposDelCuentadante) {
            $responsable = $equiposDelCuentadante->first()->responsable;

            if (mb_strtolower($responsable->correo) === $correoAsignado) {
                continue; // ya le llega el correo de asignación con todos los equipos
            }

            [$asunto, $cuerpo] = PlantillasCorreo::novedadMasivaParaResponsable(
                $equiposDelCuentadante,
                $descripcion,
                $reportadoPor,
                $asignado,
                $responsable,
            );

            $notificaciones[] = $servicioCorreo->resumen(
                $servicioCorreo->enviar($reportadoPor, [$responsable->correo], $asunto, $cuerpo)
            );
        }

        if ($sinCorreo->isNotEmpty()) {
            $nombres = $sinCorreo->pluck('responsable.nombre')->unique()->implode(', ');
            $notificaciones[] = $servicioCorreo->resumen(
                null,
                "Cuentadante(s) sin correo registrado ({$nombres}): no se les avisó sobre {$sinCorreo->count()} equipo(s)."
            );
        }

        if ($sinCuentadante->isNotEmpty()) {
            $notificaciones[] = $servicioCorreo->resumen(
                null,
                "{$sinCuentadante->count()} equipo(s) sin cuentadante: no se le envió correo a ningún cuentadante por ellos."
            );
        }

        return $notificaciones;
    }
}