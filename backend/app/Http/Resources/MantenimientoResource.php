<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MantenimientoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'equipo_id' => $this->equipo_id,
            'equipo' => new EquipoResource($this->whenLoaded('equipo')),
            'fecha_programada' => $this->fecha_programada?->toDateString(),
            'descripcion' => $this->descripcion,
            'fecha_completado' => $this->fecha_completado?->toDateString(),
            'estado' => $this->estado?->value,
            'estado_label' => $this->estado?->label(),
            'creado_en' => $this->created_at,
        ];
    }
}