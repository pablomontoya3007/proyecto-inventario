<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forma reducida de una licencia para la lista de "sin actualizar": lo
 * justo para saber cuál es, dónde está y cuánto lleva atrasada. Nunca
 * incluye la contraseña, igual que LicenciaOfficeResource.
 */
class LicenciaSinActualizarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fecha = $this->fecha_actualizacion;
        $ambiente = $this->equipo?->ubicacionFormacion;

        return [
            'id' => $this->id,
            'equipo_id' => $this->equipo_id,
            'placa_sena' => $this->equipo?->placa_sena,
            'ubicacion' => collect([
                $ambiente?->subsede?->sede?->nombre,
                $ambiente?->subsede?->nombre,
                $ambiente?->nombre,
            ])->filter()->implode(' › '),
            'correo' => $this->correo,
            'estado_licencia' => $this->estado_licencia?->value,
            'estado_licencia_label' => $this->estado_licencia?->label(),
            'fecha_actualizacion' => $fecha?->toDateString(),
            // round (no floor): ambas fechas están a las 00:00, así que
            // el resultado es un número entero de días; round evita
            // descuadres de una hora si la zona horaria cambiara de horario.
            'dias_sin_actualizar' => $fecha
                ? (int) round((today()->getTimestamp() - $fecha->getTimestamp()) / 86400)
                : null,
        ];
    }
}