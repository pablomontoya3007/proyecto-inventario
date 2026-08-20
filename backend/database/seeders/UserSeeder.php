<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Usuario fijo para poder iniciar sesión de inmediato en desarrollo.
     * Cambia esta contraseña antes de acercarte siquiera a producción.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@sena.edu.co'],
            [
                'name' => 'Administrador Inventario',
                'password' => 'password', // el cast 'hashed' del modelo lo cifra solo
            ]
        );

        // Un puñado de usuarios adicionales, para variar quién registra
        // cada observación.
        User::factory()->count(3)->create();
    }
}
