<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SedeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'subsedes' => SubsedeResource::collection($this->whenLoaded('subsedes')),
            'creado_en' => $this->created_at,
            'actualizado_en' => $this->updated_at,
        ];
    }
}
