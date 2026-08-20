<?php

namespace Database\Factories;

use App\Models\Equipo;
use App\Models\Observacion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Observacion>
 */
class ObservacionFactory extends Factory
{
    protected $model = Observacion::class;

    private const DESCRIPCIONES = [
        'Se realizó mantenimiento preventivo.',
        'Se reemplazó el teclado.',
        'Se actualizó el sistema operativo.',
        'Se realizó limpieza interna del equipo.',
        'Se cambió el disco duro por fallas de lectura.',
        'Se instaló software solicitado por el instructor.',
        'Se verificó conexión de red, sin novedades.',
        'Se reemplazó el cargador por daño físico.',
        'Equipo trasladado a otra ubicación de formación.',
        'Se realizó respaldo de información antes de formatear.',
    ];

    public function definition(): array
    {
        return [
            'equipo_id' => Equipo::factory(),
            'user_id' => User::factory(),
            'descripcion' => fake()->randomElement(self::DESCRIPCIONES),
        ];
    }
}
