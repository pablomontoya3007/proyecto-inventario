<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LicenciaOfficeResource extends JsonResource
{
    /**
     * password_cifrado NUNCA aparece aquí, ni siquiera cifrada. El modelo
     * ya la oculta con $hidden como red de seguridad, pero este Resource
     * ni siquiera la menciona — dos capas independientes protegiendo lo
     * mismo, igual que con la inmutabilidad de Observacion.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'equipo_id' => $this->equipo_id,
            'correo' => $this->correo,
            'estado_licencia' => $this->estado_licencia?->value,
            'estado_licencia_label' => $this->estado_licencia?->label(),
            'fecha_actualizacion' => $this->fecha_actualizacion?->toDateString(),
        ];
    }
}
