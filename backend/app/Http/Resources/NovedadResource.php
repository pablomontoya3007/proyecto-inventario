<?php

namespace App\Http\Resources;

use App\Support\PlantillasCorreo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Las relaciones anidadas (equipo.tipoEquipo, equipo.responsable,
 * equipo.ubicacionFormacion.subsede.sede) se precargan siempre en
 * NovedadController, así que aquí no generan consultas extra.
 *
 * equipo.ubicacion usa el mismo formato que el correo de la novedad
 * ("Sede / Subsede / Ambiente"), para que pantalla y correo coincidan.
 */
class NovedadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'descripcion' => $this->descripcion,
            'estado' => $this->estado?->value,
            'estado_label' => $this->estado?->label(),
            'equipo' => $this->whenLoaded('equipo', fn () => $this->equipo ? [
                'id' => $this->equipo->id,
                'placa_sena' => $this->equipo->placa_sena,
                'tipo_equipo' => $this->equipo->tipoEquipo?->nombre,
                'ubicacion' => PlantillasCorreo::ubicacion($this->equipo),
                'responsable' => $this->equipo->responsable ? [
                    'id' => $this->equipo->responsable->id,
                    'nombre' => $this->equipo->responsable->nombre,
                    'correo' => $this->equipo->responsable->correo,
                ] : null,
            ] : null),
            'usuario' => $this->whenLoaded('usuario', fn () => $this->usuario ? [
                'id' => $this->usuario->id,
                'nombre' => $this->usuario->name,
            ] : null),
            'asignado' => $this->whenLoaded('asignado', fn () => $this->asignado ? [
                'id' => $this->asignado->id,
                'nombre' => $this->asignado->name,
                'correo' => $this->asignado->email,
            ] : null),
            'nota_resolucion' => $this->nota_resolucion,
            'resuelta_por' => $this->whenLoaded('resueltaPor', fn () => $this->resueltaPor ? [
                'id' => $this->resueltaPor->id,
                'nombre' => $this->resueltaPor->name,
            ] : null),
            'resuelta_en' => $this->resuelta_en?->format('Y-m-d H:i'),
            'registrada_en' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}