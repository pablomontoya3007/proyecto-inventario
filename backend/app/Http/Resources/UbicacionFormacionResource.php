<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UbicacionFormacionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subsede_id' => $this->subsede_id,
            'subsede' => new SubsedeResource($this->whenLoaded('subsede')),
            'nombre' => $this->nombre,
            'equipos_count' => $this->whenCounted('equipos'),
            'creado_en' => $this->created_at,
            'actualizado_en' => $this->updated_at,
        ];
    }
}