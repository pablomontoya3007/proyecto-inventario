<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;

/**
 * Misma estructura que los demás reportes: una sola hoja con el resumen
 * por tipo arriba y el listado completo debajo, separados por una fila
 * en blanco.
 */
class EquiposSinLicenciaExport implements FromArray
{
    public function __construct(private array $datos)
    {
    }

    public function array(): array
    {
        $filas = [];

        $filas[] = ['EQUIPOS SIN LICENCIA DE OFFICE (en uso: no incluye equipos de baja ni extraviados)'];
        $filas[] = ['Total', $this->datos['total']];
        $filas[] = [];

        $filas[] = ['POR TIPO DE EQUIPO'];
        $filas[] = ['Tipo de equipo', 'Total'];
        foreach ($this->datos['por_tipo'] as $fila) {
            $filas[] = [$fila['nombre'], $fila['total']];
        }
        $filas[] = [];

        $filas[] = ['LISTADO DE EQUIPOS SIN LICENCIA'];
        $filas[] = ['Placa SENA', 'Hostname', 'Tipo', 'Cuentadante', 'Sede', 'Subsede', 'Ubicación', 'Estado'];
        foreach ($this->datos['listado'] as $fila) {
            $filas[] = [
                $fila['placa_sena'],
                $fila['hostname'],
                $fila['tipo'],
                $fila['responsable'],
                $fila['sede'],
                $fila['subsede'],
                $fila['ubicacion'],
                $fila['estado'],
            ];
        }

        return $filas;
    }
}