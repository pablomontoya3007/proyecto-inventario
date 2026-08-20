<?php

namespace Database\Factories;

use App\Models\Sede;
use App\Models\Subsede;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subsede>
 */
class SubsedeFactory extends Factory
{
    protected $model = Subsede::class;

    // Público a propósito: EstructuraSeeder reutiliza esta misma lista
    // para repartir nombres sin repetir dentro de una misma sede.
    public const NOMBRES = [
        'Centro', 'Norte', 'Sur', 'Occidente', 'Oriente', 'Industrial', 'Rural',
    ];

    public function definition(): array
    {
        return [
            // Si no se sobreescribe, crea una Sede nueva automáticamente.
            // En el Seeder normalmente se reemplaza con ->for($sede) para
            // colgar varias subsedes de la misma sede.
            'sede_id' => Sede::factory(),
            // Sin unique(): la restricción real de la tabla es "único POR
            // sede", no global, y Faker no distingue eso — agotaría el
            // catálogo de 7 nombres mucho antes de terminar. La distinción
            // real, sin repetir dentro de una misma sede, la hace
            // EstructuraSeeder con una lista barajada por cada sede.
            'nombre' => 'Subsede ' . fake()->randomElement(self::NOMBRES),
        ];
    }
}
