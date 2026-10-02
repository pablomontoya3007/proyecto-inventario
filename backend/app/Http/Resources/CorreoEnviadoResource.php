<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CorreoEnviadoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'asunto' => $this->asunto,
            'cuerpo' => $this->cuerpo,
            'destinatarios' => $this->destinatarios ?? [],
            'total_destinatarios' => count($this->destinatarios ?? []),
            'estado' => $this->estado?->value,
            'estado_label' => $this->estado?->label(),
            'error' => $this->error,
            'remitente' => $this->whenLoaded('remitente', fn () => $this->remitente ? [
                'id' => $this->remitente->id,
                'nombre' => $this->remitente->name,
            ] : null),
            'enviado_en' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}   