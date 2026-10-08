<?php

namespace App\Imports;

use App\Enums\EstadoEquipo;
use App\Imports\Concerns\ResumeFallas;
use App\Models\Equipo;
use App\Models\Responsable;
use App\Models\TipoEquipo;
use App\Models\UbicacionFormacion;
use App\Support\NormalizadorEquipo;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

/**
 * Columnas esperadas en la fila de encabezados (mayúsculas/tildes no
 * importan, Laravel Excel las normaliza solo):
 *
 *   Placa SENA | Serial | MAC | MAC Cableada | Hostname |
 *   Tipo de equipo | Responsable | Sede | Subsede | Ambiente | Estado
 *
 * RESULTADO EN CUATRO GRUPOS (ver resumen()):
 * - importados: filas guardadas;
 * - ya_registrados: placa o serial que YA existen en el sistema — no es
 *   un error, se omiten (es normal volver a subir un Excel completo);
 * - repetidos_en_archivo: misma placa o serial que una fila ANTERIOR del
 *   mismo archivo — se importa la primera, las demás se omiten;
 * - con_errores: una entrada por fila, con todo lo que hay que corregir.
 *
 * Cómo se logra: prepareForValidation() clasifica cada fila ANTES de
 * validarla. Las reglas unique se mantienen (garantizan que una fila
 * ya registrada nunca se inserte); solo cambia cómo se REPORTA.
 *
 * Criterio de validación: solo se rechaza lo que la BD no permitiría.
 * Lo demás se normaliza con NormalizadorEquipo. Cualquier columna que
 * NO esté en COLUMNAS_FIJAS se guarda en caracteristicas_tecnicas.
 */
class EquiposImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, SkipsEmptyRows, WithBatchInserts, WithChunkReading
{
    use Importable;
    use SkipsFailures;
    use ResumeFallas;

    private const COLUMNAS_FIJAS = [
        'placa_sena', 'serial', 'mac', 'mac_cableada', 'hostname',
        'tipo_de_equipo', 'responsable', 'sede', 'subsede', 'ambiente', 'estado',
    ];

    public int $importados = 0;

    /** @var array<int, array{fila: int, placa_sena: ?string, motivo: string}> */
    private array $yaRegistrados = [];

    /** @var array<int, array{fila: int, placa_sena: ?string, motivo: string}> */
    private array $repetidosEnArchivo = [];

    /** @var array<int, string|null> fila => placa (para el reporte de errores) */
    private array $placaPorFila = [];

    /** @var array<int, true> filas ya clasificadas (se clasifican una sola vez) */
    private array $clasificadas = [];

    /** @var array<string, int> placa/serial en minúsculas => primera fila donde apareció */
    private array $filaDePlaca = [];
    private array $filaDeSerial = [];

    /** Respaldo de model(): valores ya creados en esta importación. */
    private array $placasCreadas = [];
    private array $serialesCreados = [];

    private array $cacheTipos = [];
    private array $cacheResponsables = [];
    private array $cacheUbicaciones = [];

    public function prepareForValidation($data, $index)
    {
        $row = $this->normalizar($data);
        $row['__fila'] = $index;

        $this->placaPorFila[$index] = $row['placa_sena'];
        $this->clasificar($row, (int) $index);

        return $row;
    }

    public function model(array $row)
    {
        $fila = $row['__fila'] ?? null;
        $row = $this->normalizar($row);

        // Repetida dentro del archivo: se importa solo la primera.
        if ($fila !== null && isset($this->repetidosEnArchivo[$fila])) {
            return null;
        }

        // Respaldo por si la fila no trae su número: nunca insertar dos
        // veces la misma placa/serial en el mismo lote (rompería el
        // insert masivo completo por la restricción única).
        $clavePlaca = mb_strtolower((string) $row['placa_sena']);
        $claveSerial = mb_strtolower((string) $row['serial']);

        if (isset($this->placasCreadas[$clavePlaca]) || isset($this->serialesCreados[$claveSerial])) {
            return null;
        }

        $ubicacionId = $this->resolverUbicacion($row['sede'], $row['subsede'], $row['ambiente']);
        $tipoId = $this->resolverTipoEquipo($row['tipo_de_equipo']);

        if (!$ubicacionId || !$tipoId) {
            return null;
        }

        $this->placasCreadas[$clavePlaca] = true;
        $this->serialesCreados[$claveSerial] = true;
        $this->importados++;

        return new Equipo([
            'placa_sena' => $row['placa_sena'],
            'serial' => $row['serial'],
            'mac' => $row['mac'],
            'mac_cableada' => $row['mac_cableada'],
            'hostname' => $row['hostname'],
            'tipo_equipo_id' => $tipoId,
            'responsable_id' => $this->resolverResponsable($row['responsable']),
            'ubicacion_formacion_id' => $ubicacionId,
            'estado' => $row['estado'] ?? EstadoEquipo::Activo->value,
            'caracteristicas_tecnicas' => $this->extraerCaracteristicas($row) ?: null,
        ]);
    }

    /**
     * Sin 'distinct' en placa y serial a propósito: esa regla rechazaba
     * TODAS las copias (incluida la primera). Ahora las repeticiones las
     * detecta clasificar() y se importa la primera aparición.
     */
    public function rules(): array
    {
        return [
            'placa_sena' => ['required', 'string', 'max:30', Rule::unique('equipos', 'placa_sena')],
            'serial' => ['required', 'string', 'max:100', Rule::unique('equipos', 'serial')],
            'mac' => ['nullable', 'string', 'max:50', 'distinct', Rule::unique('equipos', 'mac')],
            'mac_cableada' => ['nullable', 'string', 'max:50', 'distinct', Rule::unique('equipos', 'mac_cableada')],
            'hostname' => ['nullable', 'string', 'max:100'],
            'tipo_de_equipo' => ['required', 'string', Rule::exists('tipos_equipo', 'nombre')],
            'responsable' => ['nullable', 'string'],
            'sede' => ['required', 'string', Rule::exists('sedes', 'nombre')],
            'subsede' => ['required', 'string', Rule::exists('subsedes', 'nombre')],
            'ambiente' => ['required', 'string'],
            'estado' => ['nullable', Rule::in(array_map(fn ($caso) => $caso->value, EstadoEquipo::cases()))],
        ];
    }

    /**
     * :input = el valor que trae la celda, para saber exactamente qué
     * revisar en el Excel.
     */
    public function customValidationMessages(): array
    {
        return [
            'placa_sena.required' => 'Falta la placa SENA.',
            'placa_sena.max' => 'La placa SENA no puede superar 30 caracteres.',
            'placa_sena.unique' => 'La placa SENA ya está registrada.',
            'serial.required' => 'Falta el serial.',
            'serial.max' => 'El serial no puede superar 100 caracteres.',
            'serial.unique' => 'El serial ya está registrado.',
            'mac.max' => 'La MAC no puede superar 50 caracteres.',
            'mac.distinct' => 'La MAC ":input" se repite en otra fila del archivo.',
            'mac.unique' => 'La MAC ":input" ya pertenece a otro equipo del sistema.',
            'mac_cableada.max' => 'La MAC cableada no puede superar 50 caracteres.',
            'mac_cableada.distinct' => 'La MAC cableada ":input" se repite en otra fila del archivo.',
            'mac_cableada.unique' => 'La MAC cableada ":input" ya pertenece a otro equipo del sistema.',
            'hostname.max' => 'El hostname no puede superar 100 caracteres.',
            'tipo_de_equipo.required' => 'Falta el tipo de equipo.',
            'tipo_de_equipo.exists' => 'No existe el tipo de equipo ":input".',
            'sede.required' => 'Falta la sede.',
            'sede.exists' => 'No existe la sede ":input".',
            'subsede.required' => 'Falta la subsede.',
            'subsede.exists' => 'No existe la subsede ":input".',
            'ambiente.required' => 'Falta el ambiente.',
            'estado.in' => 'El estado ":input" no es válido (usa: activo, mantenimiento, de baja o extraviado).',
        ];
    }

    /**
     * La COMBINACIÓN sede/subsede/ambiente debe existir junta. El mensaje
     * nombra los tres valores para ubicar el problema rápido.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            foreach ($validator->getData() as $fila => $datos) {
                if (empty($datos['sede']) || empty($datos['subsede']) || empty($datos['ambiente'])) {
                    continue;
                }

                if (!$this->resolverUbicacion($datos['sede'], $datos['subsede'], $datos['ambiente'])) {
                    $validator->errors()->add(
                        $fila.'.ambiente',
                        "El ambiente \"{$datos['ambiente']}\" no existe dentro de {$datos['sede']} / {$datos['subsede']}."
                    );
                }
            }
        });
    }

    public function batchSize(): int
    {
        return 200;
    }

    public function chunkSize(): int
    {
        return 200;
    }

    /**
     * Respuesta para el frontend. Las filas ya registradas o repetidas
     * NO aparecen en con_errores (aunque sus reglas unique hayan fallado).
     */
    public function resumen(): array
    {
        $filasOmitidas = array_merge(array_keys($this->yaRegistrados), array_keys($this->repetidosEnArchivo));

        return [
            'importados' => $this->importados,
            'ya_registrados' => array_values($this->ordenarPorFila($this->yaRegistrados)),
            'repetidos_en_archivo' => array_values($this->ordenarPorFila($this->repetidosEnArchivo)),
            'con_errores' => $this->filasConErrores($filasOmitidas, $this->placaPorFila),
        ];
    }

    /**
     * Clasifica la fila UNA sola vez (si Laravel Excel volviera a
     * preparar la fila después de insertarla, no debe contarse como
     * "ya registrada"):
     * 1. ¿Repite la placa o el serial de una fila anterior del archivo?
     * 2. ¿La placa o el serial ya existen en el sistema (incluidos los
     *    equipos eliminados, que siguen ocupando su placa en la BD)?
     */
    private function clasificar(array $row, int $fila): void
    {
        if (isset($this->clasificadas[$fila])) {
            return;
        }

        $this->clasificadas[$fila] = true;

        $placa = $row['placa_sena'];
        $serial = $row['serial'];

        if ($placa === null && $serial === null) {
            return;
        }

        $clavePlaca = $placa !== null ? mb_strtolower($placa) : null;
        $claveSerial = $serial !== null ? mb_strtolower($serial) : null;

        $filaOriginal = ($clavePlaca !== null ? ($this->filaDePlaca[$clavePlaca] ?? null) : null)
            ?? ($claveSerial !== null ? ($this->filaDeSerial[$claveSerial] ?? null) : null);

        if ($filaOriginal !== null) {
            $this->repetidosEnArchivo[$fila] = [
                'fila' => $fila,
                'placa_sena' => $placa,
                'motivo' => "Repite la placa o el serial de la fila {$filaOriginal} de este archivo.",
            ];

            return;
        }

        if ($clavePlaca !== null) {
            $this->filaDePlaca[$clavePlaca] = $fila;
        }

        if ($claveSerial !== null) {
            $this->filaDeSerial[$claveSerial] = $fila;
        }

        $existente = Equipo::withTrashed()
            ->where(function ($q) use ($placa, $serial) {
                $q->when($placa !== null, fn ($s) => $s->orWhere('placa_sena', $placa))
                    ->when($serial !== null, fn ($s) => $s->orWhere('serial', $serial));
            })
            ->first(['id', 'placa_sena', 'serial', 'deleted_at']);

        if (!$existente) {
            return;
        }

        $coincidePlaca = $clavePlaca !== null && mb_strtolower((string) $existente->placa_sena) === $clavePlaca;

        $motivo = $coincidePlaca
            ? 'La placa ya está registrada en el sistema'
            : "El serial ya está registrado en el sistema (placa {$existente->placa_sena})";

        if ($existente->trashed()) {
            $motivo .= ', en un equipo eliminado';
        }

        $this->yaRegistrados[$fila] = [
            'fila' => $fila,
            'placa_sena' => $placa,
            'motivo' => $motivo . '.',
        ];
    }

    private function ordenarPorFila(array $entradas): array
    {
        ksort($entradas);

        return $entradas;
    }

    private function normalizar(array $row): array
    {
        $row['placa_sena'] = NormalizadorEquipo::texto($row['placa_sena'] ?? null);
        $row['serial'] = NormalizadorEquipo::texto($row['serial'] ?? null);
        $row['mac'] = NormalizadorEquipo::mac($row['mac'] ?? null);
        $row['mac_cableada'] = NormalizadorEquipo::mac($row['mac_cableada'] ?? null);
        $row['hostname'] = NormalizadorEquipo::texto($row['hostname'] ?? null);

        foreach (['tipo_de_equipo', 'responsable', 'sede', 'subsede', 'ambiente'] as $columna) {
            $row[$columna] = NormalizadorEquipo::nombre($row[$columna] ?? null);
        }

        $row['estado'] = NormalizadorEquipo::estado($row['estado'] ?? null);

        return $row;
    }

    private function resolverTipoEquipo(?string $nombre): ?int
    {
        if ($nombre === null) {
            return null;
        }

        $clave = mb_strtolower($nombre);

        if (!array_key_exists($clave, $this->cacheTipos)) {
            $this->cacheTipos[$clave] = TipoEquipo::where('nombre', $nombre)->value('id');
        }

        return $this->cacheTipos[$clave];
    }

    /**
     * Si el responsable no existe, devuelve NULL y el equipo queda sin
     * asignar (se puede asignar después desde el formulario de edición).
     */
    private function resolverResponsable(?string $nombre): ?int
    {
        if ($nombre === null) {
            return null;
        }

        $clave = mb_strtolower($nombre);

        if (!array_key_exists($clave, $this->cacheResponsables)) {
            $this->cacheResponsables[$clave] = Responsable::where('nombre', $nombre)->value('id');
        }

        return $this->cacheResponsables[$clave];
    }

    private function resolverUbicacion(?string $sede, ?string $subsede, ?string $ambiente): ?int
    {
        if ($sede === null || $subsede === null || $ambiente === null) {
            return null;
        }

        $clave = mb_strtolower($sede.'|'.$subsede.'|'.$ambiente);

        if (!array_key_exists($clave, $this->cacheUbicaciones)) {
            $this->cacheUbicaciones[$clave] = UbicacionFormacion::query()
                ->where('nombre', $ambiente)
                ->whereHas('subsede', function ($q) use ($sede, $subsede) {
                    $q->where('nombre', $subsede)
                        ->whereHas('sede', fn ($q2) => $q2->where('nombre', $sede));
                })
                ->value('id');
        }

        return $this->cacheUbicaciones[$clave];
    }

    /**
     * Todo lo que no esté en COLUMNAS_FIJAS va a caracteristicas_tecnicas.
     * Se descartan columnas sin encabezado y las claves internas "__..."
     * (como __fila).
     */
    private function extraerCaracteristicas(array $row): array
    {
        return collect($row)
            ->filter(fn ($valor, $clave) => is_string($clave)
                && $clave !== ''
                && !str_starts_with($clave, '__')
                && !in_array($clave, self::COLUMNAS_FIJAS, true)
                && trim((string) $valor) !== '')
            ->toArray();
    }
}