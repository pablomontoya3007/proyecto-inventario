<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TipoEquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'activo' => $this->activo,
            // Total de equipos del tipo, sin filtrar. El frontend lo usa
            // para decidir si "Eliminar" debe deshabilitarse.
            'equipos_count' => $this->whenCounted('equipos'),
            // Solo viaja cuando el Controller aplicó ?estado= — es el
            // número que la tabla muestra mientras haya un filtro activo.
            'equipos_count_filtrado' => $this->whenCounted('equipos_count_filtrado'),
        ];
    }
}