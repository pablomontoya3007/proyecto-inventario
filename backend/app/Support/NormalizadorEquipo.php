<?php

namespace App\Support;

/**
 * Limpieza de datos de equipos compartida entre el formulario unitario
 * (EquipoRequest) y la importación desde Excel (EquiposImport). Vive en
 * un solo lugar para que un equipo creado a mano y uno importado queden
 * guardados exactamente igual.
 *
 * Ningún método rechaza datos: solo los convierten a una forma estándar.
 * Lo que sí es obligatorio (unicidad, longitud máxima) lo deciden las
 * reglas de validación, que reflejan las restricciones de la BD.
 */
final class NormalizadorEquipo
{
    /**
     * Valores que la gente escribe cuando un equipo no tiene MAC. Se
     * guardan como NULL: si se guardaran tal cual, la restricción única
     * de la columna haría fallar al segundo equipo con "N/A".
     */
    private const MAC_SIN_VALOR = [
        'N/A', 'NA', 'NO APLICA', 'NO TIENE', 'SIN MAC', 'NINGUNA', 'NINGUNO', '-', '--', '0',
    ];

    /**
     * Variantes escritas a mano que corresponden a un estado válido del
     * enum EstadoEquipo (activo, mantenimiento, de_baja, extraviado).
     */
    private const ALIAS_ESTADO = [
        'en_mantenimiento' => 'mantenimiento',
        'dado_de_baja' => 'de_baja',
        'baja' => 'de_baja',
    ];

    /**
     * Convierte cualquier valor escalar a texto recortado. Cubre el caso
     * de Excel, que entrega números cuando la celda es numérica: un float
     * entero grande (ej. un serial 123456789012345) se escribe completo
     * en vez de en notación científica "1.23456789012E+14".
     */
    public static function texto(mixed $valor): ?string
    {
        if ($valor === null || !is_scalar($valor)) {
            return null;
        }

        if (is_bool($valor)) {
            $valor = $valor ? '1' : '0';
        } elseif (is_float($valor) && floor($valor) === $valor && abs($valor) < 1e15) {
            $valor = number_format($valor, 0, '', '');
        }

        $valor = trim((string) $valor);

        return $valor === '' ? null : $valor;
    }

    /**
     * Para nombres que se buscan contra la BD (sede, subsede, ambiente,
     * tipo, responsable): además de recortar, colapsa espacios dobles
     * internos, que son invisibles en Excel y hacen fallar la búsqueda.
     */
    public static function nombre(mixed $valor): ?string
    {
        $texto = self::texto($valor);

        return $texto === null ? null : preg_replace('/\s+/u', ' ', $texto);
    }

    /**
     * Acepta la MAC en cualquier formato. Si lo escrito tiene forma de
     * MAC (12 hexadecimales, con o sin ":", "-", "." o espacios), se
     * guarda en el formato estándar AA:BB:CC:DD:EE:FF — así la misma MAC
     * escrita de dos formas distintas se detecta como duplicada. Si no
     * tiene esa forma, se guarda tal cual, sin rechazarla.
     */
    public static function mac(mixed $valor): ?string
    {
        $texto = self::texto($valor);

        if ($texto === null || in_array(mb_strtoupper($texto), self::MAC_SIN_VALOR, true)) {
            return null;
        }

        $sinSeparadores = preg_replace('/[\s:.\-]/', '', $texto);

        if (strlen($sinSeparadores) === 12 && ctype_xdigit($sinSeparadores)) {
            return strtoupper(implode(':', str_split($sinSeparadores, 2)));
        }

        return $texto;
    }

    /**
     * "Activo", "ACTIVO", "de baja", "De-Baja", "En mantenimiento" → el
     * valor real del enum. Lo que no se reconozca se devuelve igual y lo
     * rechaza la regla de validación del estado.
     */
    public static function estado(mixed $valor): ?string
    {
        $texto = self::texto($valor);

        if ($texto === null) {
            return null;
        }

        $clave = preg_replace('/_+/', '_', str_replace([' ', '-'], '_', mb_strtolower($texto)));

        return self::ALIAS_ESTADO[$clave] ?? $clave;
    }
}