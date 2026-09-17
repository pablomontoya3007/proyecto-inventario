<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrasladoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'equipo_id' => $this->equipo_id,
            'equipo' => new EquipoResource($this->whenLoaded('equipo')),
            'ubicacion_origen' => new UbicacionFormacionResource($this->whenLoaded('ubicacionOrigen')),
            'ubicacion_destino' => new UbicacionFormacionResource($this->whenLoaded('ubicacionDestino')),
            'fecha_traslado' => $this->fecha_traslado?->toDateString(),
            'motivo' => $this->motivo,
            'registrado_en' => $this->created_at,
        ];
    }
}