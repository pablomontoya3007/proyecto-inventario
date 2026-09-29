<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * Plantilla con las columnas exactas que espera EquiposImport, más una
 * fila de ejemplo (que no se importa tal cual — quien la use debe
 * borrarla o reemplazarla) para que quede claro qué va en cada columna.
 */
class EquiposImportPlantillaExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'Placa SENA', 'Serial', 'MAC', 'MAC Cableada', 'Hostname',
            'Tipo de equipo', 'Responsable', 'Sede', 'Subsede', 'Ambiente', 'Estado',
        ];
    }

    public function array(): array
    {
        return [
            [
                'SENA-000001', 'SN-EJEMPLO01', 'AA:BB:CC:DD:EE:01', '', 'pc-ejemplo',
                'Computador de escritorio', 'Juan Pérez', 'Sede Pereira', 'Subsede Oriente', 'Sala de Sistemas 1', 'activo',
            ],
        ];
    }
}