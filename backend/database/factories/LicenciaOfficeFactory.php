<?php

namespace Database\Factories;

use App\Models\Equipo;
use App\Models\LicenciaOffice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LicenciaOffice>
 */
class LicenciaOfficeFactory extends Factory
{
    protected $model = LicenciaOffice::class;

    public function definition(): array
    {
        return [
            'equipo_id' => Equipo::factory(),
            'correo' => fake()->unique()->userName() . '@sena.edu.co',
            'estado_licencia' => fake()->randomElement(['activa', 'activa', 'activa', 'vencida', 'suspendida']),
            // El cast "encrypted" del modelo cifra esto antes de guardar;
            // aquí solo generamos el texto plano de prueba.
            'password_cifrado' => fake()->password(10, 14),
            // No hace falta poner fecha_actualizacion aquí: el modelo
            // LicenciaOffice ya la fija sola en el evento "saving" cada vez
            // que la contraseña cambia (también al crear un registro nuevo).
        ];
    }
}
