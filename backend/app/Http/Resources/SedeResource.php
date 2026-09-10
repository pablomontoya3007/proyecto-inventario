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
            // Dos formas de traer subsedes, para dos casos distintos —
            // nunca vienen pobladas las dos al mismo tiempo:
            // - subsedes: objetos completos, cuando el controller usó ->load() (show()).
            // - subsedes_count: solo el número, cuando usó ->withCount() (index()).
            'subsedes' => SubsedeResource::collection($this->whenLoaded('subsedes')),
            'subsedes_count' => $this->whenCounted('subsedes'),
            'creado_en' => $this->created_at,
            'actualizado_en' => $this->updated_at,
        ];
    }
}