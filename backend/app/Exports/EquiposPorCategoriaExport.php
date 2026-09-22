<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;

/**
 * Una sola hoja con las cuatro agrupaciones apiladas (separadas por una
 * fila en blanco), en vez de hojas independientes — más simple de
 * generar para un reporte pensado para revisarse rápido, no para
 * procesarse por código después.
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
        $filas[] = [];

        $filas[] = ['LISTADO DE EQUIPOS'];
        $filas[] = ['Placa SENA', 'Tipo', 'Sede', 'Subsede', 'Ambiente', 'Estado'];
        foreach ($this->datos['listado'] as $fila) {
            $filas[] = [
                $fila['placa_sena'],
                $fila['tipo'],
                $fila['sede'],
                $fila['subsede'],
                $fila['ambiente'],
                $fila['estado'],
            ];
        }

        return $filas;
    }
}