<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * Plantilla con las columnas exactas que espera LicenciasImport, más
 * una fila de ejemplo (quien la use debe borrarla o reemplazarla). La
 * contraseña de ejemplo es ficticia a propósito.
 */
class LicenciasImportPlantillaExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return ['Placa SENA', 'Correo', 'Contraseña', 'Estado'];
    }

    public function array(): array
    {
        return [
            ['SENA-000001', 'licencia.ejemplo@sena.edu.co', 'CambiarEsta123', 'activa'],
        ];
    }
}