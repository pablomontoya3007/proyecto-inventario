<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'usuario' => $this->usuario?->name ?? 'Sistema',
            'accion' => $this->accion,
            // class_basename: "App\Models\Equipo" -> "Equipo". No tiene
            // sentido exponer el namespace completo al frontend.
            'entidad' => class_basename($this->auditable_type),
            'entidad_id' => $this->auditable_id,
            'cambios' => $this->cambios,
            'fecha' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
