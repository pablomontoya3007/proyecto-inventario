<?php

namespace App\Imports;

use App\Enums\EstadoEquipo;
use App\Models\Equipo;
use App\Models\Responsable;
use App\Models\TipoEquipo;
use App\Models\UbicacionFormacion;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\Importable;
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
 * refiere la fila. Tipo de equipo y Responsable se buscan por nombre
 * EXACTO contra lo que ya existe en el sistema (no se crean tipos ni
 * responsables nuevos desde aquí).
 *
 * Cualquier columna que NO esté en la lista de arriba se guarda tal
 * cual en caracteristicas_tecnicas (la columna JSON de Equipo), con el
 * nombre de columna ya normalizado (minúsculas, guion bajo — ej.
 * "RAM (GB)" se guarda con la clave "ram_gb") como clave. El archivo
 * no necesita una plantilla rígida distinta por tipo de equipo:
 * "Procesador", "RAM (GB)" o "Marca" simplemente viajan como vengan.
 */
class EquiposImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithBatchInserts, WithChunkReading
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

    public function model(array $row)
    {
        $ubicacionId = $this->resolverUbicacion($row['sede'], $row['subsede'], $row['ambiente']);

        // No debería pasar (withValidator ya lo valida abajo), pero por
        // si acaso: sin ubicación resuelta, se descarta la fila en vez
        // de crear un equipo con ubicacion_formacion_id nulo.
        if (!$ubicacionId) {
            return null;
        }

        $this->importados++;

        $responsableNombre = $this->vacioANull($row['responsable'] ?? null);

        return new Equipo([
            'placa_sena' => trim($row['placa_sena']),
            'serial' => trim($row['serial']),
            'mac' => $this->vacioANull($row['mac'] ?? null),
            'mac_cableada' => $this->vacioANull($row['mac_cableada'] ?? null),
            'hostname' => $this->vacioANull($row['hostname'] ?? null),
            'tipo_equipo_id' => $this->resolverTipoEquipo($row['tipo_de_equipo']),
            'responsable_id' => $responsableNombre ? $this->resolverResponsable($responsableNombre) : null,
            'ubicacion_formacion_id' => $ubicacionId,
            'estado' => $this->vacioANull($row['estado'] ?? null) ?? EstadoEquipo::Activo->value,
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
                'nullable', 'string', 'regex:/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/', 'distinct',
                Rule::unique('equipos', 'mac'),
            ],
            'mac_cableada' => [
                'nullable', 'string', 'regex:/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/', 'distinct',
                Rule::unique('equipos', 'mac_cableada'),
            ],
            'tipo_de_equipo' => ['required', 'string', Rule::exists('tipos_equipo', 'nombre')],
            'responsable' => ['nullable', 'string', Rule::exists('responsables', 'nombre')],
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
            'placa_sena.distinct' => 'La placa SENA se repite en otra fila de este mismo archivo.',
            'placa_sena.unique' => 'Ya existe un equipo con esta placa SENA en el sistema.',
            'serial.required' => 'El serial es obligatorio.',
            'serial.distinct' => 'El serial se repite en otra fila de este mismo archivo.',
            'serial.unique' => 'Ya existe un equipo con este serial en el sistema.',
            'mac.regex' => 'El formato de la MAC debe ser AA:BB:CC:DD:EE:FF.',
            'mac.distinct' => 'Esta MAC se repite en otra fila de este mismo archivo.',
            'mac.unique' => 'Ya existe un equipo con esta MAC en el sistema.',
            'mac_cableada.regex' => 'El formato de la MAC cableada debe ser AA:BB:CC:DD:EE:FF.',
            'mac_cableada.distinct' => 'Esta MAC cableada se repite en otra fila de este mismo archivo.',
            'mac_cableada.unique' => 'Ya existe un equipo con esta MAC cableada en el sistema.',
            'tipo_de_equipo.required' => 'La columna "Tipo de equipo" es obligatoria.',
            'tipo_de_equipo.exists' => 'No existe un tipo de equipo con ese nombre exacto.',
            'responsable.exists' => 'No existe un responsable con ese nombre exacto.',
            'sede.required' => 'La columna "Sede" es obligatoria.',
            'sede.exists' => 'No existe una sede con ese nombre exacto.',
            'subsede.required' => 'La columna "Subsede" es obligatoria.',
            'subsede.exists' => 'No existe una subsede con ese nombre exacto.',
            'ambiente.required' => 'La columna "Ambiente" es obligatoria.',
            'estado.in' => 'El estado debe ser uno de: activo, mantenimiento, de_baja, extraviado.',
        ];
    }

    /**
     * Sede/Subsede/Ambiente ya se validan por separado arriba (que cada
     * nombre exista en su tabla) — aquí se valida que la COMBINACIÓN de
     * los tres exista junta: que ese ambiente exacto pertenezca a esa
     * subsede exacta, que a su vez pertenezca a esa sede exacta.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $datos = $validator->getData();

            if (
                !empty($datos['sede']) && !empty($datos['subsede']) && !empty($datos['ambiente'])
                && !$this->resolverUbicacion($datos['sede'], $datos['subsede'], $datos['ambiente'])
            ) {
                $validator->errors()->add(
                    'ambiente',
                    'Ese ambiente no existe dentro de esa sede/subsede exacta (revisa nombres y tildes).'
                );
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

    private function resolverTipoEquipo(string $nombre): ?int
    {
        $clave = mb_strtolower(trim($nombre));

        return $this->cacheTipos[$clave] ??= TipoEquipo::where('nombre', trim($nombre))->value('id');
    }

    private function resolverResponsable(string $nombre): ?int
    {
        $clave = mb_strtolower(trim($nombre));

        return $this->cacheResponsables[$clave] ??= Responsable::where('nombre', trim($nombre))->value('id');
    }

    private function resolverUbicacion(string $sede, string $subsede, string $ambiente): ?int
    {
        $clave = mb_strtolower(trim($sede).'|'.trim($subsede).'|'.trim($ambiente));

        if (array_key_exists($clave, $this->cacheUbicaciones)) {
            return $this->cacheUbicaciones[$clave];
        }

        return $this->cacheUbicaciones[$clave] = UbicacionFormacion::query()
            ->where('nombre', trim($ambiente))
            ->whereHas('subsede', function ($q) use ($sede, $subsede) {
                $q->where('nombre', trim($subsede))
                    ->whereHas('sede', fn ($q2) => $q2->where('nombre', trim($sede)));
            })
            ->value('id');
    }

    private function vacioANull($valor): ?string
    {
        $valor = trim((string) $valor);

        return $valor === '' ? null : $valor;
    }

    /**
     * Todo lo que traiga la fila y no esté en COLUMNAS_FIJAS se guarda
     * en caracteristicas_tecnicas, con el nombre de columna ya
     * normalizado por Laravel Excel (minúsculas, guion bajo) como clave.
     */
    private function extraerCaracteristicas(array $row): array
    {
        return collect($row)
            ->filter(fn ($valor, $clave) => !in_array($clave, self::COLUMNAS_FIJAS, true) && trim((string) $valor) !== '')
            ->toArray();
    }
}