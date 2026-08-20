<?php

namespace App\Enums;

enum EstadoLicencia: string
{
    case Activa = 'activa';
    case Vencida = 'vencida';
    case Suspendida = 'suspendida';

    public function label(): string
    {
        return match ($this) {
            self::Activa => 'Activa',
            self::Vencida => 'Vencida',
            self::Suspendida => 'Suspendida',
        };
    }
}
