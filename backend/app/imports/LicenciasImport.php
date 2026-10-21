<?php

namespace App\Imports;

use App\Enums\EstadoLicencia;
use App\Imports\Concerns\ResumeFallas;
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
 * Columnas esperadas: Placa SENA | Correo | Contraseña | Estado
 *
 * La placa decide qué pasa con cada fila, igual que en EquiposImport:
 * - El equipo NO tiene licencia → se CREA (correo y contraseña
 *   obligatorios; estado vacío = "activa").
 * - El equipo YA tiene licencia → se ACTUALIZA lo que cambió. Celda
 *   vacía = "no tocar" (igual que el formulario de edición, donde dejar
 *   la contraseña vacía conserva la actual).
 *
 * RESULTADO EN CINCO GRUPOS (ver resumen()): importados, actualizados,
 * sin_cambios, repetidos_en_archivo y con_errores.
 *
 * La contraseña se compara DESCIFRADA: el cast "encrypted" genera un
 * cifrado distinto cada vez aunque el texto sea el mismo, así que
 * comparar el valor guardado daría "cambió" siempre.
 *
 * Sin WithBatchInserts a propósito: LicenciaOffice depende de sus
 * eventos (fecha_actualizacion y AuditoriaObserver). Se guarda fila por
 * fila, así que cada fila ya está en la BD cuando se valida la siguiente.
 *
 * SEGURIDAD: el resumen nunca incluye correos ni contraseñas — solo
 * fila, placa, mensajes y el NOMBRE de los campos que cambiaron.
 */
class LicenciasImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, SkipsEmptyRows, WithChunkReading
{
    use Importable;
    use SkipsFailures;
    use ResumeFallas;

    public int $importados = 0;

    private array $cacheEquipos = [];

    /** @var array<int, array{fila: int, placa_sena: string, cambios: string[]}> */
    private array $actualizados = [];

    /** @var array<int, array{fila: int, placa_sena: ?string, motivo: string}> */
    private array $sinCambios = [];

    /** @var array<int, array{fila: int, placa_sena: ?string, motivo: string}> */
    private array $repetidosEnArchivo = [];

    private array $placaPorFila = [];
    private array $clasificadas = [];

    /** @var array<string, int> placa en minúsculas => primera fila */
    private array $filaDePlaca = [];

    public function prepareForValidation($data, $index)
    {
        $row = $this->normalizar($data);

        $this->placaPorFila[$index] = $row['placa_sena'];
        $this->clasificar($row['placa_sena'], (int) $index);

        $row['__fila'] = $index;

        return $row;
    }

    public function model(array $row)
    {
        $fila = (int) ($row['__fila'] ?? 0);
        $row = $this->normalizar($row);

        if (isset($this->repetidosEnArchivo[$fila])) {
            return null;
        }

        $equipoId = $this->resolverEquipo($row['placa_sena']);

        if (!$equipoId) {
            return null;
        }

        $licencia = LicenciaOffice::where('equipo_id', $equipoId)->first();

        if ($licencia) {
            $this->actualizar($licencia, $row, $fila);

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
     * Correo y contraseña son opcionales AQUÍ (para actualizar, vacío =
     * conservar). Para una licencia NUEVA se exigen en withValidator().
     */
    public function rules(): array
    {
        return [
            'placa_sena' => [
                'required', 'string',
                Rule::exists('equipos', 'placa_sena')->whereNull('deleted_at'),
            ],
            'correo' => ['nullable', 'string', 'max:150'],
            'contrasena' => ['nullable', 'string'],
            'estado' => ['nullable', Rule::enum(EstadoLicencia::class)],
        ];
    }

    /**
     * :input solo en la placa y el estado — NUNCA en correo ni
     * contraseña, para que esos datos no viajen en los mensajes.
     */
    public function customValidationMessages(): array
    {
        return [
            'placa_sena.required' => 'Falta la placa SENA.',
            'placa_sena.exists' => 'No existe un equipo (activo) con la placa ":input".',
            'correo.max' => 'El correo no puede superar 150 caracteres.',
            'estado.enum' => 'El estado ":input" no es válido (usa: activa, vencida o suspendida).',
        ];
    }

    /**
     * Si el equipo todavía no tiene licencia, la fila va a CREAR una:
     * correo y contraseña son obligatorios.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            foreach ($validator->getData() as $fila => $datos) {
                if (isset($this->repetidosEnArchivo[$fila])) {
                    continue;
                }

                $equipoId = $this->resolverEquipo($datos['placa_sena'] ?? null);

                if (!$equipoId || LicenciaOffice::where('equipo_id', $equipoId)->exists()) {
                    continue;
                }

                if (empty($datos['correo'])) {
                    $validator->errors()->add($fila.'.correo', 'Falta el correo (obligatorio para una licencia nueva).');
                }

                if (($datos['contrasena'] ?? null) === null) {
                    $validator->errors()->add($fila.'.contrasena', 'Falta la contraseña (obligatoria para una licencia nueva).');
                }
            }
        });
    }

    public function chunkSize(): int
    {
        return 200;
    }

    public function resumen(): array
    {
        ksort($this->actualizados);
        ksort($this->sinCambios);
        ksort($this->repetidosEnArchivo);

        return [
            'importados' => $this->importados,
            'actualizados' => array_values($this->actualizados),
            'sin_cambios' => array_values($this->sinCambios),
            'repetidos_en_archivo' => array_values($this->repetidosEnArchivo),
            'con_errores' => $this->filasConErrores(array_keys($this->repetidosEnArchivo), $this->placaPorFila),
        ];
    }

    /**
     * El detalle de cambios nombra el campo pero nunca muestra correos ni
     * contraseñas (solo el estado, que no es sensible).
     */
    private function actualizar(LicenciaOffice $licencia, array $row, int $fila): void
    {
        $cambios = [];

        if ($row['correo'] !== null && $row['correo'] !== $licencia->correo) {
            $licencia->correo = $row['correo'];
            $cambios[] = 'Correo';
        }

        if ($row['contrasena'] !== null && $row['contrasena'] !== $licencia->password_cifrado) {
            $licencia->password_cifrado = $row['contrasena'];
            $cambios[] = 'Contraseña';
        }

        if ($row['estado'] !== null && $row['estado'] !== $licencia->estado_licencia?->value) {
            $antes = $licencia->estado_licencia?->label() ?? '(vacío)';
            $licencia->estado_licencia = $row['estado'];
            $cambios[] = "Estado: \"{$antes}\" → \"".EstadoLicencia::from($row['estado'])->label().'"';
        }

        if (empty($cambios)) {
            $this->sinCambios[$fila] = [
                'fila' => $fila,
                'placa_sena' => $row['placa_sena'],
                'motivo' => 'La licencia ya estaba registrada con los mismos datos.',
            ];

            return;
        }

        $licencia->save();

        $this->actualizados[$fila] = [
            'fila' => $fila,
            'placa_sena' => $row['placa_sena'],
            'cambios' => $cambios,
        ];
    }

    /**
     * Se clasifica UNA vez por fila: una placa repetida dentro del mismo
     * archivo se omite (se procesa solo la primera aparición).
     */
    private function clasificar(?string $placa, int $fila): void
    {
        if (isset($this->clasificadas[$fila]) || $placa === null) {
            return;
        }

        $this->clasificadas[$fila] = true;
        $clave = mb_strtolower($placa);

        if (isset($this->filaDePlaca[$clave])) {
            $this->repetidosEnArchivo[$fila] = [
                'fila' => $fila,
                'placa_sena' => $placa,
                'motivo' => "Repite la placa de la fila {$this->filaDePlaca[$clave]} de este archivo.",
            ];

            return;
        }

        $this->filaDePlaca[$clave] = $fila;
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
     * La contraseña NO se recorta: un espacio puede ser parte real de ella.
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