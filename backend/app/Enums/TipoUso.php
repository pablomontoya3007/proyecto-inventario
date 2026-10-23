<?php

namespace App\Enums;

/**
 * Para qué se usa el equipo. "No aplica" cubre los equipos que no son
 * explícitamente de formación ni administrativos (p. ej. un switch o un
 * access point de la red general).
 *
 * Igual que EstadoEquipo, se guarda como texto en la BD: agregar un tipo
 * nuevo no requiere migración.
 */
enum TipoUso: string
{
    case Formacion = 'formacion';
    case Administrativo = 'administrativo';
    case NoAplica = 'no_aplica';

    public function label(): string
    {
        return match ($this) {
            self::Formacion => 'Uso de formación',
            self::Administrativo => 'Uso administrativo',
            self::NoAplica => 'No aplica',
        };
    }
}