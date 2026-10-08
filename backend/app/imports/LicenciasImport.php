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
 * (Estado opcional: vacío = "activa").
 *
 * RESULTADO EN CUATRO GRUPOS (ver resumen()), igual que EquiposImport:
 * importados, ya_registrados (el equipo YA tenía licencia — no es error,
 * se omite), repetidos_en_archivo (misma placa en una fila anterior) y
 * con_errores (una entrada por fila).
 *
 * Sin WithBatchInserts a propósito: LicenciaOffice depende de sus
 * eventos (fecha_actualizacion y AuditoriaObserver). Se guarda fila por
 * fila, así que cada fila ya está en la BD cuando se valida la siguiente.
 *
 * SEGURIDAD: el resumen nunca incluye correos ni contraseñas — solo
 * fila, placa y mensajes.
 */
class LicenciasImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, SkipsEmptyRows, WithChunkReading
{
    use Importable;
    use SkipsFailures;
    use ResumeFallas;

    public int $importados = 0;

    private array $cacheEquipos = [];

    /** @var array<int, array{fila: int, placa_sena: ?string, motivo: string}> */
    private array $yaRegistrados = [];

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

        return $row;
    }

    public function model(array $row)
    {
        $row = $this->normalizar($row);
        $equipoId = $this->resolverEquipo($row['placa_sena']);

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

    public function rules(): array
    {
        return [
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
     * :input solo en la placa y el estado — NUNCA en correo ni
     * contraseña, para que esos datos no viajen en los mensajes.
     */
    public function customValidationMessages(): array
    {
        return [
            'placa_sena.required' => 'Falta la placa SENA.',
            'placa_sena.exists' => 'No existe un equipo (activo) con la placa ":input".',
            'correo.required' => 'Falta el correo.',
            'correo.max' => 'El correo no puede superar 150 caracteres.',
            'contrasena.required' => 'Falta la contraseña.',
            'estado.enum' => 'El estado ":input" no es válido (usa: activa, vencida o suspendida).',
        ];
    }

    /**
     * Garantiza "un equipo, una licencia" (restricción única de la BD).
     * Las filas que fallan aquí por estar ya registradas o repetidas se
     * reportan en su propio grupo, no como errores.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            foreach ($validator->getData() as $fila => $datos) {
                $equipoId = $this->resolverEquipo($datos['placa_sena'] ?? null);

                if ($equipoId && LicenciaOffice::where('equipo_id', $equipoId)->exists()) {
                    $validator->errors()->add($fila.'.placa_sena', 'Este equipo ya tiene una licencia.');
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
        $filasOmitidas = array_merge(array_keys($this->yaRegistrados), array_keys($this->repetidosEnArchivo));

        ksort($this->yaRegistrados);
        ksort($this->repetidosEnArchivo);

        return [
            'importados' => $this->importados,
            'ya_registrados' => array_values($this->yaRegistrados),
            'repetidos_en_archivo' => array_values($this->repetidosEnArchivo),
            'con_errores' => $this->filasConErrores($filasOmitidas, $this->placaPorFila),
        ];
    }

    /**
     * Se clasifica UNA vez por fila, y primero se revisa el archivo:
     * como las filas se guardan una a una, una placa repetida en el
     * archivo ya estaría en la BD cuando llega su copia — sin este orden
     * se reportaría como "ya registrada" en vez de "repetida".
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
        $equipoId = $this->resolverEquipo($placa);

        if ($equipoId && LicenciaOffice::where('equipo_id', $equipoId)->exists()) {
            $this->yaRegistrados[$fila] = [
                'fila' => $fila,
                'placa_sena' => $placa,
                'motivo' => 'El equipo ya tiene una licencia registrada.',
            ];
        }
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