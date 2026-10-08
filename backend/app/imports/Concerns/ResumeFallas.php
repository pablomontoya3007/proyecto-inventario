<?php

namespace App\Imports\Concerns;

/**
 * Convierte las fallas de validación de Laravel Excel (una por cada
 * regla que falló) en UNA entrada por fila: { fila, placa_sena, errores[] }.
 *
 * Las filas en $filasOmitidas (ya registradas o repetidas en el archivo)
 * no se reportan como errores: se informan aparte, en su propio grupo.
 *
 * SEGURIDAD: nunca devuelve los valores de la fila (Failure::values()),
 * solo la placa y los mensajes — en licencias, los valores incluyen la
 * contraseña.
 *
 * Requiere que la clase use SkipsFailures (método failures()).
 */
trait ResumeFallas
{
    /**
     * @param  int[]  $filasOmitidas
     * @param  array<int, string|null>  $placaPorFila
     * @return array<int, array{fila: int, placa_sena: string|null, errores: string[]}>
     */
    protected function filasConErrores(array $filasOmitidas, array $placaPorFila): array
    {
        $omitidas = array_flip($filasOmitidas);

        return collect($this->failures())
            ->reject(fn ($falla) => isset($omitidas[$falla->row()]))
            ->groupBy(fn ($falla) => $falla->row())
            ->sortKeys()
            ->map(fn ($fallas, $fila) => [
                'fila' => (int) $fila,
                'placa_sena' => $placaPorFila[$fila] ?? null,
                'errores' => $fallas->flatMap(fn ($falla) => $falla->errors())->unique()->values()->all(),
            ])
            ->values()
            ->all();
    }
}