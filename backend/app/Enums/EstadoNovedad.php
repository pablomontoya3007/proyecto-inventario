<?php

namespace App\Enums;

enum EstadoNovedad: string
{
    case Abierta = 'abierta';
    case Resuelta = 'resuelta';

    public function label(): string
    {
        return match ($this) {
            self::Abierta => 'Abierta',
            self::Resuelta => 'Resuelta',
        };
    }
}