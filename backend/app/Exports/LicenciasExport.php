<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;

class LicenciasExport implements FromArray
{
    public function __construct(private array $datos)
    {
    }

    public function array(): array
    {
        $filas = [];

        $filas[] = ['LICENCIAS POR ESTADO'];
        $filas[] = ['Estado', 'Total'];
        foreach ($this->datos['por_estado'] as $fila) {
            $filas[] = [$fila['estado'], $fila['total']];
        }
        $filas[] = [];

        $filas[] = ['LICENCIAS QUE REQUIEREN ATENCIÓN (vencidas o suspendidas)'];
        $filas[] = ['Equipo', 'Correo', 'Estado', 'Última actualización'];
        foreach ($this->datos['requieren_atencion'] as $fila) {
            $filas[] = [$fila['equipo'], $fila['correo'], $fila['estado'], $fila['fecha_actualizacion']];
        }

        return $filas;
    }
}