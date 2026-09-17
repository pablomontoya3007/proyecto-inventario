<?php

namespace App\Enums;

enum EstadoMantenimiento: string
{
    case EnEspera = 'en_espera';
    case EnMantenimiento = 'en_mantenimiento';
    case Listo = 'listo';

    public function label(): string
    {
        return match ($this) {
            self::EnEspera => 'En espera',
            self::EnMantenimiento => 'En mantenimiento',
            self::Listo => 'Listo',
        };
    }
}