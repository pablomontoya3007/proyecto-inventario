<?php

namespace App\Enums;

enum EstadoEquipo: string
{
    case Activo = 'activo';
    case Mantenimiento = 'mantenimiento';
    case DeBaja = 'de_baja';
    case Extraviado = 'extraviado';

    public function label(): string
    {
        return match ($this) {
            self::Activo => 'Activo',
            self::Mantenimiento => 'En mantenimiento',
            self::DeBaja => 'De baja',
            self::Extraviado => 'Extraviado',
        };
    }
}
