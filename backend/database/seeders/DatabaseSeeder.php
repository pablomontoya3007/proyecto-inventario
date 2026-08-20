<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Orden importa: cada seeder asume que los anteriores ya corrieron
     * (Equipo necesita Ubicaciones y Responsables ya creados, por ejemplo).
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            TipoEquipoSeeder::class,
            EstructuraSeeder::class,
            ResponsableSeeder::class,
            EquipoSeeder::class,
        ]);
    }
}
