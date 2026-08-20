<?php

namespace Database\Factories;

use App\Models\Responsable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Responsable>
 */
class ResponsableFactory extends Factory
{
    protected $model = Responsable::class;

    private const CARGOS = [
        'Instructor', 'Coordinador Académico', 'Auxiliar Administrativo',
        'Líder de Grupo', 'Apoyo Administrativo', 'Instructor de Sistemas',
    ];

    public function definition(): array
    {
        return [
            'nombre' => fake()->name(),
            // Formato simplificado de cédula colombiana: 8-10 dígitos.
            'documento' => fake()->unique()->numerify('##########'),
            'cargo' => fake()->randomElement(self::CARGOS),
        ];
    }
}
