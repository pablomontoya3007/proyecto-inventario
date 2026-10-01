<?php

namespace App\Imports;

use App\Enums\EstadoEquipo;
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
 * Sede/Subsede/Ambiente van en tres columnas separadas porque un mismo
 * nombre de ambiente (ej. "Sala de Sistemas 1") se repite en varias
 * subsedes — sin las tres juntas no hay forma de saber a cuál se
 * refiere la fila.
 *
 * Criterio de validación: solo se rechaza una fila por lo que la base
 * de datos no permitiría (placa/serial/MAC repetidas, longitudes
 * máximas, tipo y ubicación obligatorios). Todo lo demás se normaliza
 * con NormalizadorEquipo en vez de rechazarse:
 *   - Placa, serial y MAC aceptan cualquier formato o tipo de dato.
 *   - Espacios sobrantes y mayúsculas en estado no importan.
 *   - Un responsable que no existe deja el equipo sin asignar.
 *
 * Cualquier columna que NO esté en COLUMNAS_FIJAS se guarda tal cual en
 * caracteristicas_tecnicas (la columna JSON de Equipo), con el nombre de
 * columna ya normalizado (minúsculas, guion bajo — ej. "RAM (GB)" se
 * guarda con la clave "ram_gb") como clave.
 */
class EquiposImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, SkipsEmptyRows, WithBatchInserts, WithChunkReading
{
    use Importable;
    use SkipsFailures;

    // Columnas que sí tienen un campo fijo en Equipo — todo lo demás
    // que traiga la fila se interpreta como característica técnica.
    private const COLUMNAS_FIJAS = [
        'placa_sena', 'serial', 'mac', 'mac_cableada', 'hostname',
        'tipo_de_equipo', 'responsable', 'sede', 'subsede', 'ambiente', 'estado',
    ];

    public int $importados = 0;

    private array $cacheTipos = [];
    private array $cacheResponsables = [];
    private array $cacheUbicaciones = [];

    /**
     * Se ejecuta ANTES de validar cada fila. Laravel Excel entrega esta
     * misma fila ya normalizada a model(); aun así model() vuelve a
     * normalizar (la operación es idempotente) para no depender de ese
     * detalle interno de la librería.
     */
    public function prepareForValidation($data, $index)
    {
        return $this->normalizar($data);
    }

    public function model(array $row)
    {
        $row = $this->normalizar($row);

        $ubicacionId = $this->resolverUbicacion($row['sede'], $row['subsede'], $row['ambiente']);
        $tipoId = $this->resolverTipoEquipo($row['tipo_de_equipo']);

        // No debería pasar (las reglas ya lo validan), pero por si acaso:
        // sin ubicación o tipo no se puede crear el equipo (columnas
        // NOT NULL en la BD), así que se descarta la fila.
        if (!$ubicacionId || !$tipoId) {
            return null;
        }

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

    public function rules(): array
    {
        return [
            'placa_sena' => [
                'required', 'string', 'max:30', 'distinct',
                Rule::unique('equipos', 'placa_sena'),
            ],
            'serial' => [
                'required', 'string', 'max:100', 'distinct',
                Rule::unique('equipos', 'serial'),
            ],
            'mac' => [
                'nullable', 'string', 'max:50', 'distinct',
                Rule::unique('equipos', 'mac'),
            ],
            'mac_cableada' => [
                'nullable', 'string', 'max:50', 'distinct',
                Rule::unique('equipos', 'mac_cableada'),
            ],
            // Antes no se validaba: un hostname de más de 100 caracteres
            // provocaba un error de MySQL que tumbaba el lote completo.
            'hostname' => ['nullable', 'string', 'max:100'],
            'tipo_de_equipo' => ['required', 'string', Rule::exists('tipos_equipo', 'nombre')],
            'responsable' => ['nullable', 'string'],
            'sede' => ['required', 'string', Rule::exists('sedes', 'nombre')],
            'subsede' => ['required', 'string', Rule::exists('subsedes', 'nombre')],
            'ambiente' => ['required', 'string'],
            'estado' => ['nullable', Rule::in(array_map(fn ($caso) => $caso->value, EstadoEquipo::cases()))],
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            'placa_sena.required' => 'La placa SENA es obligatoria.',
            'placa_sena.max' => 'La placa SENA no puede superar 30 caracteres.',
            'placa_sena.distinct' => 'La placa SENA se repite en otra fila de este mismo archivo.',
            'placa_sena.unique' => 'Ya existe un equipo con esta placa SENA en el sistema.',
            'serial.required' => 'El serial es obligatorio.',
            'serial.max' => 'El serial no puede superar 100 caracteres.',
            'serial.distinct' => 'El serial se repite en otra fila de este mismo archivo.',
            'serial.unique' => 'Ya existe un equipo con este serial en el sistema.',
            'mac.max' => 'La MAC no puede superar 50 caracteres.',
            'mac.distinct' => 'Esta MAC se repite en otra fila de este mismo archivo.',
            'mac.unique' => 'Ya existe un equipo con esta MAC en el sistema.',
            'mac_cableada.max' => 'La MAC cableada no puede superar 50 caracteres.',
            'mac_cableada.distinct' => 'Esta MAC cableada se repite en otra fila de este mismo archivo.',
            'mac_cableada.unique' => 'Ya existe un equipo con esta MAC cableada en el sistema.',
            'hostname.max' => 'El hostname no puede superar 100 caracteres.',
            'tipo_de_equipo.required' => 'La columna "Tipo de equipo" es obligatoria.',
            'tipo_de_equipo.exists' => 'No existe un tipo de equipo con ese nombre.',
            'sede.required' => 'La columna "Sede" es obligatoria.',
            'sede.exists' => 'No existe una sede con ese nombre.',
            'subsede.required' => 'La columna "Subsede" es obligatoria.',
            'subsede.exists' => 'No existe una subsede con ese nombre.',
            'ambiente.required' => 'La columna "Ambiente" es obligatoria.',
            'estado.in' => 'El estado debe ser uno de: activo, mantenimiento, de baja, extraviado.',
        ];
    }

    /**
     * Sede/Subsede/Ambiente ya se validan por separado arriba (que cada
     * nombre exista en su tabla) — aquí se valida que la COMBINACIÓN de
     * los tres exista junta: que ese ambiente pertenezca a esa subsede,
     * que a su vez pertenezca a esa sede. Esto se mantiene porque sin
     * ubicación el equipo no se puede guardar (columna NOT NULL).
     *
     * Laravel Excel valida por LOTES: getData() devuelve todas las filas
     * del lote (indexadas por número de fila), por eso se recorre, y el
     * error se registra con la clave "{fila}.ambiente".
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
                        'Ese ambiente no existe dentro de esa sede/subsede (revisa los nombres).'
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

    /**
     * array_key_exists en vez de ??=: con ??= un resultado NULL (nombre
     * no encontrado) no queda en caché y se repetía la consulta en cada
     * fila con ese mismo nombre.
     */
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
     * asignar (la columna responsable_id admite NULL). Se puede asignar
     * después desde el formulario de edición.
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
     * Todo lo que traiga la fila y no esté en COLUMNAS_FIJAS se guarda
     * en caracteristicas_tecnicas. Se descartan columnas sin encabezado
     * (clave numérica o vacía), que Excel genera cuando hay celdas
     * sueltas a la derecha de la tabla.
     */
    private function extraerCaracteristicas(array $row): array
    {
        return collect($row)
            ->filter(fn ($valor, $clave) => is_string($clave)
                && $clave !== ''
                && !in_array($clave, self::COLUMNAS_FIJAS, true)
                && trim((string) $valor) !== '')
            ->toArray();
    }
}