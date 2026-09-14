<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ResponsablesExport implements FromArray, WithHeadings
{
    public function __construct(private array $top)
    {
    }

    public function array(): array
    {
        return array_map(fn ($fila) => [$fila['nombre'], $fila['total']], $this->top);
    }

    public function headings(): array
    {
        return ['Responsable', 'Equipos asignados'];
    }
}