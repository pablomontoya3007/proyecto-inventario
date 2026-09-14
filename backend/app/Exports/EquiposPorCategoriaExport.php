<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;

/**
 * Una sola hoja con las tres agrupaciones apiladas (separadas por una
 * fila en blanco), en vez de tres hojas independientes — más simple de
 * generar para un reporte pensado para revisarse rápido, no para
 * procesarse por código después. Si más adelante hace falta una hoja
 * por categoría, el cambio queda contenido a esta sola clase.
 */
class EquiposPorCategoriaExport implements FromArray
{
    public function __construct(private array $datos)
    {
    }

    public function array(): array
    {
        $filas = [];

        $filas[] = ['EQUIPOS POR SEDE'];
        $filas[] = ['Sede', 'Total'];
        foreach ($this->datos['por_sede'] as $fila) {
            $filas[] = [$fila->nombre, $fila->total];
        }
        $filas[] = [];

        $filas[] = ['EQUIPOS POR TIPO'];
        $filas[] = ['Tipo de equipo', 'Total'];
        foreach ($this->datos['por_tipo'] as $fila) {
            $filas[] = [$fila->nombre, $fila->total];
        }
        $filas[] = [];

        $filas[] = ['EQUIPOS POR ESTADO'];
        $filas[] = ['Estado', 'Total'];
        foreach ($this->datos['por_estado'] as $fila) {
            $filas[] = [$fila['estado'], $fila['total']];
        }

        return $filas;
    }
}