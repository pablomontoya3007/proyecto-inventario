<?php

namespace Database\Factories;

use App\Models\Sede;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sede>
 */
class SedeFactory extends Factory
{
    protected $model = Sede::class;

    /**
     * Ciudades reales donde el SENA tiene sedes, para que los datos de
     * prueba se vean como un inventario real y no como texto genérico.
     */
    private const CIUDADES = [
        'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
        'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Cúcuta',
        'Villavicencio', 'Neiva', 'Popayán', 'Montería', 'Pasto',
    ];

    public function definition(): array
    {
        return [
            'nombre' => 'Sede ' . fake()->unique()->randomElement(self::CIUDADES),
        ];
    }
}
