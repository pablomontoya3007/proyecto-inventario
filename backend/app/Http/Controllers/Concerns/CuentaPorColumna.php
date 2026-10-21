<?php

namespace App\Http\Controllers\Concerns;

use BackedEnum;
use Illuminate\Database\Eloquent\Builder;

/**
 * Cuenta registros agrupados por una columna (normalmente "estado") en
 * UNA sola consulta GROUP BY, y devuelve todos los valores posibles del
 * enum — los que no aparecen quedan en 0, para que el frontend nunca
 * reciba un contador faltante.
 *
 * La usan los contadores de Equipos, Licencias, Mantenimientos y
 * Novedades, que se calculan sobre la misma consulta filtrada del
 * listado (ver el index() de cada controlador).
 */
trait CuentaPorColumna
{
    /**
     * @param  BackedEnum[]  $casos  p. ej. EstadoEquipo::cases()
     * @return array<string, int>  valor del enum => cantidad
     */
    private function contarPorColumna(Builder $consulta, string $columna, array $casos): array
    {
        // reorder(): el ORDER BY del listado no tiene sentido (y en MySQL
        // estricto falla) junto a un GROUP BY. toBase(): valores crudos,
        // sin el cast a enum que convertiría la clave en un objeto.
        $conteos = $consulta
            ->reorder()
            ->toBase()
            ->select($columna)
            ->selectRaw('count(*) as total')
            ->groupBy($columna)
            ->pluck('total', $columna);

        $resultado = [];

        foreach ($casos as $caso) {
            $resultado[$caso->value] = (int) ($conteos[$caso->value] ?? 0);
        }

        return $resultado;
    }
}