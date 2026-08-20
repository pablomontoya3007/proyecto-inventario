<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ObservacionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // 'equipo' solo aparece si el Controller la precargó — útil
            // para el reporte de "historial de observaciones" (todas las
            // sedes a la vez), innecesario cuando ya se ven colgadas
            // dentro de la hoja de vida de un equipo específico.
            'equipo' => new EquipoResource($this->whenLoaded('equipo')),
            'usuario' => new UserResource($this->whenLoaded('usuario')),
            'descripcion' => $this->descripcion,
            'registrada_en' => $this->created_at,
        ];
    }
}
