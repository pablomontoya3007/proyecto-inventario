<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubsedeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sede_id' => $this->sede_id,
            'sede' => new SedeResource($this->whenLoaded('sede')),
            'nombre' => $this->nombre,
            'ubicaciones_formacion' => UbicacionFormacionResource::collection($this->whenLoaded('ubicacionesFormacion')),
            'creado_en' => $this->created_at,
            'actualizado_en' => $this->updated_at,
        ];
    }
}
