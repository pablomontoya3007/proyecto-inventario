<?php

namespace Database\Seeders;

use App\Models\TipoEquipo;
use Illuminate\Database\Seeder;

class TipoEquipoSeeder extends Seeder
{
    /**
     * Catálogo cerrado (ver requisitos, sección 1). Se siembra directo,
     * sin factory al azar, porque son datos de negocio fijos, no datos
     * de prueba aleatorios. firstOrCreate lo hace seguro de re-correr.
     */
    public function run(): void
    {
        $tipos = [
            'Computador portátil',
            'Computador de escritorio',
            'Todo en uno',
            'Impresora',
            'Access Point',
            'Router',
            'Switch',
            'Otro dispositivo de conectividad',
        ];

        foreach ($tipos as $nombre) {
            TipoEquipo::firstOrCreate(['nombre' => $nombre], ['activo' => true]);
        }
    }
}
