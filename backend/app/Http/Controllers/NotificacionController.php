<?php

namespace App\Http\Controllers;

use App\Http\Resources\LicenciaSinActualizarResource;
use App\Models\LicenciaOffice;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Alertas del sistema calculadas en el momento de pedirlas: no hay tabla
 * de notificaciones ni tarea programada de por medio. Cada consulta
 * recalcula contra los datos actuales, así que nunca quedan alertas
 * viejas ni hace falta "marcarlas como leídas" — en cuanto la licencia
 * se actualiza, deja de aparecer sola.
 *
 * Es global a propósito: no respeta los filtros de la pantalla de
 * Licencias, para que una alerta no desaparezca solo porque alguien
 * filtró por otra sede.
 */
class NotificacionController extends Controller
{
    public function licenciasSinActualizar(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LicenciaOffice::class);

        $licencias = LicenciaOffice::query()
            ->sinActualizar()
            // Una licencia cuyo equipo ya fue eliminado (soft delete) no
            // tiene a quién avisar ni dónde buscarla: no se notifica.
            ->whereHas('equipo')
            ->with('equipo.ubicacionFormacion.subsede.sede')
            ->orderBy('fecha_actualizacion') // las más atrasadas primero
            ->paginate(10);

        return LicenciaSinActualizarResource::collection($licencias)
            ->additional(['meses_limite' => LicenciaOffice::MESES_SIN_ACTUALIZAR]);
    }
}