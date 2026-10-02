<?php

namespace App\Enums;

enum EstadoCorreo: string
{
    case Enviado = 'enviado';
    case Fallido = 'fallido';

    public function label(): string
    {
        return match ($this) {
            self::Enviado => 'Enviado',
            self::Fallido => 'Fallido',
        };
    }
}