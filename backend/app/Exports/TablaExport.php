<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Exportación genérica "una tabla en una hoja": encabezados en negrita y
 * columnas con ancho automático. La usan los botones "Exportar Excel" de
 * Licencias, Mantenimientos, Novedades, Traslados, Observaciones y
 * Usuarios — cada controlador decide QUÉ columnas y filas manda; esta
 * clase solo se encarga de cómo se ve el archivo.
 *
 * Se envía un arreglo ya armado (no una consulta) a propósito: así cada
 * módulo controla qué datos salen y ninguno puede filtrar por accidente
 * un campo sensible (p. ej. la contraseña de una licencia).
 */
class TablaExport implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
{
    /**
     * @param  string[]  $encabezados
     * @param  array<int, array<int, mixed>>  $filas
     */
    public function __construct(private array $encabezados, private array $filas)
    {
    }

    public function headings(): array
    {
        return $this->encabezados;
    }

    public function array(): array
    {
        return $this->filas;
    }

    public function styles(Worksheet $hoja): array
    {
        return [1 => ['font' => ['bold' => true]]];
    }
}