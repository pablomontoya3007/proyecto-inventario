<?php

namespace App\Imports;

use App\Enums\EstadoLicencia;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Support\NormalizadorEquipo;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

/**
 * Columnas esperadas en la fila de encabezados (mayúsculas/tildes no
 * importan, Laravel Excel las normaliza solo — "Contraseña" llega como
 * "contrasena"):
 *
 *   Placa SENA | Correo | Contraseña | Estado
 *
 * El equipo se identifica por Placa SENA, no por su id interno. Estado
 * es opcional: vacío = "activa".
 *
 * Criterio de validación: solo se rechaza lo que la base de datos no
 * permitiría (placa inexistente, un equipo con dos licencias, correo de
 * más de 150 caracteres, campos obligatorios vacíos). Ya no se exige
 * formato de correo ni longitud mínima de contraseña.
 *
 * A DIFERENCIA de EquiposImport, aquí NO se usa WithBatchInserts a
 * propósito: los inserts masivos se saltan los eventos de Eloquent, y
 * LicenciaOffice depende de ellos — el evento "saving" fija
 * fecha_actualizacion y AuditoriaObserver registra la creación. Guardar
 * fila por fila tiene además un efecto útil: cada fila ya está en la BD
 * cuando se valida la siguiente, así que la regla "un equipo, una
 * licencia" cubre también las filas repetidas dentro del archivo.
 *
 * El cifrado de la contraseña no requiere nada especial: el cast
 * "encrypted" del modelo cifra al asignar, igual que en store().
 */
class LicenciasImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, SkipsEmptyRows, WithChunkReading
{
    use Importable;
    use SkipsFailures;

    public int $importados = 0;

    private array $cacheEquipos = [];

    public function model(array $row)
    {
        $row = $this->normalizar($row);
        $equipoId = $this->resolverEquipo($row['placa_sena']);

        // No debería pasar (rules() ya exige que la placa exista), pero
        // por si acaso: sin equipo resuelto se descarta la fila.
        if (!$equipoId) {
            return null;
        }

        $this->importados++;

        return new LicenciaOffice([
            'equipo_id' => $equipoId,
            'correo' => $row['correo'],
            'password_cifrado' => $row['contrasena'],
            'estado_licencia' => $row['estado'] ?? EstadoLicencia::Activa->value,
        ]);
    }

    /**
     * Excel entrega números cuando la celda es numérica (ej. una
     * contraseña "12345678" o una placa "123456"): se convierten a texto
     * antes de validar para que la regla "string" no los rechace.
     */
    public function prepareForValidation($data, $index)
    {
        return $this->normalizar($data);
    }

    public function rules(): array
    {
        return [
            // whereNull('deleted_at'): un equipo eliminado (soft delete)
            // no debe recibir licencias nuevas.
            'placa_sena' => [
                'required', 'string',
                Rule::exists('equipos', 'placa_sena')->whereNull('deleted_at'),
            ],
            'correo' => ['required', 'string', 'max:150'],
            'contrasena' => ['required', 'string'],
            'estado' => ['nullable', Rule::enum(EstadoLicencia::class)],
        ];
    }

    /**
     * Ningún mensaje usa :input a propósito — así la contraseña nunca
     * termina escrita dentro de un mensaje de error.
     */
    public function customValidationMessages(): array
    {
        return [
            'placa_sena.required' => 'La placa SENA es obligatoria.',
            'placa_sena.exists' => 'No existe un equipo (activo) con esa placa SENA.',
            'correo.required' => 'El correo es obligatorio.',
            'correo.max' => 'El correo no puede superar 150 caracteres.',
            'contrasena.required' => 'La contraseña es obligatoria.',
            'estado.enum' => 'El estado debe ser uno de: activa, vencida, suspendida.',
        ];
    }

    /**
     * Regla que depende de la BD en el momento exacto de validar: el
     * equipo no puede tener ya una licencia (restricción única de
     * equipo_id en la migración). Como las filas se guardan una a una,
     * esto también detecta una placa repetida dentro del mismo archivo.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            foreach ($validator->getData() as $fila => $datos) {
                $equipoId = $this->resolverEquipo($datos['placa_sena'] ?? null);

                if ($equipoId && LicenciaOffice::where('equipo_id', $equipoId)->exists()) {
                    $validator->errors()->add(
                        $fila.'.placa_sena',
                        'Este equipo ya tiene una licencia (en el sistema o en una fila anterior de este archivo).'
                    );
                }
            }
        });
    }

    public function chunkSize(): int
    {
        return 200;
    }

    private function resolverEquipo(?string $placa): ?int
    {
        if ($placa === null || $placa === '') {
            return null;
        }

        $clave = mb_strtolower($placa);

        if (array_key_exists($clave, $this->cacheEquipos)) {
            return $this->cacheEquipos[$clave];
        }

        return $this->cacheEquipos[$clave] = Equipo::where('placa_sena', $placa)->value('id');
    }

    /**
     * La placa usa el mismo normalizador que la importación de equipos,
     * para que una placa numérica se busque igual a como se guardó.
     *
     * La contraseña NO se recorta: un espacio al inicio o al final puede
     * ser parte real de ella (el formulario tampoco la recorta — el
     * middleware TrimStrings de Laravel excluye "password").
     * Estado se pasa a minúsculas para aceptar "Activa" o "ACTIVA".
     */
    private function normalizar(array $row): array
    {
        $row['placa_sena'] = NormalizadorEquipo::texto($row['placa_sena'] ?? null);
        $row['correo'] = NormalizadorEquipo::texto($row['correo'] ?? null);

        $contrasena = $row['contrasena'] ?? null;
        $row['contrasena'] = ($contrasena === null || $contrasena === '' || !is_scalar($contrasena))
            ? null
            : (string) $contrasena;

        $estado = NormalizadorEquipo::texto($row['estado'] ?? null);
        $row['estado'] = $estado !== null ? mb_strtolower($estado) : null;

        return $row;
    }
}