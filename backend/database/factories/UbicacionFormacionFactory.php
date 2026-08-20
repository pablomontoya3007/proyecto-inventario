<?php

namespace Database\Factories;

use App\Models\Subsede;
use App\Models\UbicacionFormacion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UbicacionFormacion>
 */
class UbicacionFormacionFactory extends Factory
{
    protected $model = UbicacionFormacion::class;

    // Público a propósito: EstructuraSeeder reutiliza esta misma lista.
    public const NOMBRES = [
        'Sala de Sistemas 1', 'Sala de Sistemas 2', 'Sala de Sistemas 3',
        'Taller de Electrónica', 'Taller de Electricidad', 'Laboratorio de Redes',
        'Biblioteca', 'Auditorio Principal', 'Coordinación Académica',
    ];

    public function definition(): array
    {
        return [
            'subsede_id' => Subsede::factory(),
            // Sin unique(), misma razón que en SubsedeFactory.
            'nombre' => fake()->randomElement(self::NOMBRES),
        ];
    }
}
