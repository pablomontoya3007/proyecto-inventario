<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

/**
 * Extrae los tres niveles de filtro de ubicación (sede, subsede,
 * ubicación de formación) desde la query string, con los mismos
 * nombres de parámetro en todos los controladores que filtran por
 * ubicación: sede_id, subsede_id, ubicacion_formacion_id.
 *
 * Se extrajo a un trait porque esta misma extracción ya se repetía en
 * ReporteController y LicenciaOfficeController, y ahora también la
 * necesitan Responsables, Mantenimientos, Traslados y Observaciones.
 */
trait FiltraPorUbicacion
{
    /**
     * @return array{0: ?int, 1: ?int, 2: ?int}
     */
    private function filtrosUbicacion(Request $request): array
    {
        return [
            $request->filled('sede_id') ? (int) $request->input('sede_id') : null,
            $request->filled('subsede_id') ? (int) $request->input('subsede_id') : null,
            $request->filled('ubicacion_formacion_id') ? (int) $request->input('ubicacion_formacion_id') : null,
        ];
    }
}