<?php

namespace Database\Factories;

use App\Models\TipoEquipo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TipoEquipo>
 *
 * Este catálogo tiene una lista cerrada de 8 valores (ver requisitos,
 * sección 1). El Seeder los va a crear directo con nombres fijos, no al
 * azar con este factory — lo dejamos aquí sobre todo para tests
 * automatizados que necesiten "un tipo de equipo cualquiera" sin
 * depender de que el catálogo ya esté sembrado.
 */
class TipoEquipoFactory extends Factory
{
    protected $model = TipoEquipo::class;

    private const TIPOS = [
        'Computador portátil', 'Computador de escritorio', 'Todo en uno',
        'Impresora', 'Access Point', 'Router', 'Switch',
        'Otro dispositivo de conectividad',
    ];

    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->randomElement(self::TIPOS),
            'activo' => true,
        ];
    }
}
