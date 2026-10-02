<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Nunca incluye la contraseña ni el remember_token (además, ambos
     * están en $hidden del modelo).
     *
     * observaciones_count usa whenCounted: solo aparece cuando la
     * consulta lo pidió con withCount (listado de Usuarios), no en /me.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->name,
            'correo' => $this->email,
            'creado_en' => $this->created_at?->toDateString(),
            'observaciones_count' => $this->whenCounted('observaciones'),
        ];
    }
}