<?php

namespace App\Imports;

use App\Enums\EstadoEquipo;
use App\Enums\TipoUso;
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
 *   Tipo de equipo | Responsable | Sede | Subsede | Ambiente | Estado |
 *   Tipo de uso
 *
 * "Tipo de uso" es opcional: vacío en un equipo nuevo = "Uso de
 * formación"; vacío en uno existente = no se cambia. La columna puede
 * faltar por completo (Excel viejos siguen funcionando igual).
 *
 * La PLACA SENA decide qué pasa con cada fila:
 * - Placa nueva → se CREA el equipo (serial, tipo y ubicación obligatorios).
 * - Placa que ya existe → se ACTUALIZAN los campos que cambiaron. Una
 *   celda VACÍA significa "no tocar este campo", nunca "borrarlo": así
 *   un Excel con solo algunas columnas llenas no le borra datos a nadie.
 *   Si nada cambió, la fila se reporta como "sin cambios".
 *
 * RESULTADO EN CINCO GRUPOS (ver resumen()):
 * - importados: equipos nuevos creados;
 * - actualizados: equipos existentes con al menos un campo cambiado,
 *   con el detalle "campo: antes → después";
 * - sin_cambios: equipos existentes idénticos a lo que ya había;
 * - repetidos_en_archivo: misma placa o serial que una fila ANTERIOR del
 *   mismo archivo — se procesa la primera, las demás se omiten;
 * - con_errores: una entrada por fila, con todo lo que hay que corregir.
 *
 * Por qué la unicidad (serial, MAC) se valida en withValidator() y no
 * con Rule::unique en rules(): una fila que actualiza un equipo debe
 * poder repetir SU PROPIO serial y MAC — la regla tiene que ignorar a
 * ese equipo, y ese id cambia de fila a fila.
 *
 * Los equipos nuevos se insertan por lotes (WithBatchInserts, rápido);
 * las actualizaciones se guardan una a una con save() a propósito: así
 * pasan por AuditoriaObserver y cada cambio masivo queda en el
 * historial con su valor anterior y el nuevo.
 *
 * Cualquier columna que NO esté en COLUMNAS_FIJAS se guarda en
 * caracteristicas_tecnicas (al actualizar se COMBINA con las que ya
 * tenía el equipo: las columnas del Excel pisan, las demás se conservan).
 */
class EquiposImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, SkipsEmptyRows, WithBatchInserts, WithChunkReading
{
    use Importable;
    use SkipsFailures;
    use ResumeFallas;

    private const COLUMNAS_FIJAS = [
        'placa_sena', 'serial', 'mac', 'mac_cableada', 'hostname',
        'tipo_de_equipo', 'responsable', 'sede', 'subsede', 'ambiente', 'estado', 'tipo_de_uso',
    ];

    /** Nombre legible de cada campo en el detalle de "actualizados". */
    private const ETIQUETAS = [
        'serial' => 'Serial',
        'mac' => 'MAC',
        'mac_cableada' => 'MAC cableada',
        'hostname' => 'Hostname',
        'tipo_equipo_id' => 'Tipo de equipo',
        'responsable_id' => 'Cuentadante',
        'ubicacion_formacion_id' => 'Ubicación',
        'estado' => 'Estado',
        'tipo_uso' => 'Tipo de uso',
    ];

    public int $importados = 0;

    /** @var array<int, array{fila: int, placa_sena: string, cambios: string[]}> */
    private array $actualizados = [];

    /** @var array<int, array{fila: int, placa_sena: ?string, motivo: string}> */
    private array $sinCambios = [];

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

    /** @var array<string, Equipo|false> placa en minúsculas => equipo existente (o false) */
    private array $cacheExistentes = [];

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

        // Repetida dentro del archivo: se procesa solo la primera.
        if ($fila !== null && isset($this->repetidosEnArchivo[$fila])) {
            return null;
        }

        $existente = $this->equipoExistente($row['placa_sena']);

        if ($existente) {
            $this->actualizar($existente, $row, (int) $fila);

            return null; // ya se guardó con save(); no va al insert por lotes
        }

        return $this->nuevoEquipo($row);
    }

    /**
     * Todo lo que no sea la placa es opcional AQUÍ: para un equipo que
     * ya existe, una celda vacía significa "no cambiar". Los campos
     * obligatorios de un equipo NUEVO se exigen en withValidator().
     */
    public function rules(): array
    {
        return [
            'placa_sena' => ['required', 'string', 'max:30'],
            'serial' => ['nullable', 'string', 'max:100'],
            'mac' => ['nullable', 'string', 'max:50', 'distinct'],
            'mac_cableada' => ['nullable', 'string', 'max:50', 'distinct'],
            'hostname' => ['nullable', 'string', 'max:100'],
            'tipo_de_equipo' => ['nullable', 'string', Rule::exists('tipos_equipo', 'nombre')],
            'responsable' => ['nullable', 'string'],
            'sede' => ['nullable', 'string', Rule::exists('sedes', 'nombre')],
            'subsede' => ['nullable', 'string', Rule::exists('subsedes', 'nombre')],
            'ambiente' => ['nullable', 'string'],
            'estado' => ['nullable', Rule::in(array_map(fn ($caso) => $caso->value, EstadoEquipo::cases()))],
            'tipo_de_uso' => ['nullable', Rule::in(array_map(fn ($caso) => $caso->value, TipoUso::cases()))],
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
            'serial.max' => 'El serial no puede superar 100 caracteres.',
            'mac.max' => 'La MAC no puede superar 50 caracteres.',
            'mac.distinct' => 'La MAC ":input" se repite en otra fila del archivo.',
            'mac_cableada.max' => 'La MAC cableada no puede superar 50 caracteres.',
            'mac_cableada.distinct' => 'La MAC cableada ":input" se repite en otra fila del archivo.',
            'hostname.max' => 'El hostname no puede superar 100 caracteres.',
            'tipo_de_equipo.exists' => 'No existe el tipo de equipo ":input".',
            'sede.exists' => 'No existe la sede ":input".',
            'subsede.exists' => 'No existe la subsede ":input".',
            'estado.in' => 'El estado ":input" no es válido (usa: activo, mantenimiento, de baja o extraviado).',
            'tipo_de_uso.in' => 'El tipo de uso ":input" no es válido (usa: formación, administrativo o no aplica).',
        ];
    }

    /**
     * Reglas que dependen de si el equipo ya existe:
     * - equipo eliminado: no se crea ni se actualiza;
     * - equipo nuevo: serial, tipo, sede, subsede y ambiente obligatorios;
     * - serial y MAC no pueden pertenecer a OTRO equipo (el propio se
     *   ignora, para que una fila de actualización pueda repetirlos);
     * - sede/subsede/ambiente: si viene alguno, deben venir los tres y
     *   existir juntos (un equipo existente puede dejarlos los tres vacíos
     *   para conservar su ubicación).
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            foreach ($validator->getData() as $fila => $datos) {
                $placa = $datos['placa_sena'] ?? null;

                if ($placa === null || isset($this->repetidosEnArchivo[$fila])) {
                    continue;
                }

                if (Equipo::onlyTrashed()->where('placa_sena', $placa)->exists()) {
                    $validator->errors()->add(
                        $fila.'.placa_sena',
                        'La placa pertenece a un equipo eliminado: no se crea ni se actualiza.'
                    );

                    continue;
                }

                $existente = $this->equipoExistente($placa);

                if (!$existente) {
                    $this->exigirCamposDeEquipoNuevo($validator, $fila, $datos);
                }

                $this->validarUnicos($validator, $fila, $datos, $existente?->id);
                $this->validarUbicacion($validator, $fila, $datos);
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
     * Respuesta para el frontend. Las filas repetidas en el archivo NO
     * aparecen en con_errores.
     */
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

    private function nuevoEquipo(array $row): ?Equipo
    {
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
            // Siempre explícito (aunque la BD tenga default): el insert por
            // lotes necesita las mismas columnas en todas las filas.
            'tipo_uso' => $row['tipo_de_uso'] ?? TipoUso::Formacion->value,
            'caracteristicas_tecnicas' => $this->extraerCaracteristicas($row) ?: null,
        ]);
    }

    /**
     * Compara campo por campo y guarda solo lo que cambió. Las celdas
     * vacías se ignoran (conservan el valor actual). La comparación es
     * como texto: Excel puede entregar 16 (número) donde la BD tiene "16".
     */
    private function actualizar(Equipo $equipo, array $row, int $fila): void
    {
        $equipo->loadMissing(['tipoEquipo', 'responsable', 'ubicacionFormacion.subsede.sede']);

        $nuevos = array_filter([
            'serial' => $row['serial'],
            'mac' => $row['mac'],
            'mac_cableada' => $row['mac_cableada'],
            'hostname' => $row['hostname'],
            'tipo_equipo_id' => $this->resolverTipoEquipo($row['tipo_de_equipo']),
            // Un cuentadante escrito que no existe se ignora: conserva el
            // actual en vez de dejar el equipo sin asignar.
            'responsable_id' => $this->resolverResponsable($row['responsable']),
            'ubicacion_formacion_id' => $this->resolverUbicacion($row['sede'], $row['subsede'], $row['ambiente']),
            'estado' => $row['estado'],
            'tipo_uso' => $row['tipo_de_uso'],
        ], fn ($valor) => $valor !== null);

        $cambios = [];

        foreach ($nuevos as $campo => $valor) {
            $actual = $equipo->{$campo} instanceof \BackedEnum ? $equipo->{$campo}->value : $equipo->{$campo};

            if ((string) $actual !== (string) $valor) {
                $cambios[] = $this->describirCambio($equipo, $campo, $valor);
                $equipo->{$campo} = $valor;
            }
        }

        $caracteristicas = $this->extraerCaracteristicas($row);

        if ($caracteristicas) {
            $actuales = $equipo->caracteristicas_tecnicas ?? [];
            $cambioCaracteristicas = false;

            foreach ($caracteristicas as $clave => $valor) {
                $antes = $actuales[$clave] ?? null;

                if ((string) $antes !== (string) $valor) {
                    $cambios[] = $this->textoCambio($this->etiquetaCaracteristica($clave), $antes, $valor);
                    $actuales[$clave] = $valor;
                    $cambioCaracteristicas = true;
                }
            }

            if ($cambioCaracteristicas) {
                $equipo->caracteristicas_tecnicas = $actuales;
            }
        }

        if (empty($cambios)) {
            $this->sinCambios[$fila] = [
                'fila' => $fila,
                'placa_sena' => $equipo->placa_sena,
                'motivo' => 'Ya estaba registrado con los mismos datos.',
            ];

            return;
        }

        // Las relaciones se cargaron solo para describir el "antes": se
        // quitan para que no queden desactualizadas en la caché.
        $equipo->unsetRelations();
        $equipo->save();

        $this->actualizados[$fila] = [
            'fila' => $fila,
            'placa_sena' => $equipo->placa_sena,
            'cambios' => $cambios,
        ];
    }

    /**
     * Para los campos que son llaves foráneas se muestran los NOMBRES
     * (tipo, cuentadante, ubicación), no los ids.
     */
    private function describirCambio(Equipo $equipo, string $campo, mixed $nuevo): string
    {
        $etiqueta = self::ETIQUETAS[$campo];

        return match ($campo) {
            'tipo_equipo_id' => $this->textoCambio(
                $etiqueta,
                $equipo->tipoEquipo?->nombre,
                TipoEquipo::whereKey($nuevo)->value('nombre')
            ),
            'responsable_id' => $this->textoCambio(
                $etiqueta,
                $equipo->responsable?->nombre,
                Responsable::whereKey($nuevo)->value('nombre')
            ),
            'ubicacion_formacion_id' => $this->textoCambio(
                $etiqueta,
                $this->rutaUbicacion($equipo->ubicacionFormacion),
                $this->rutaUbicacion(UbicacionFormacion::with('subsede.sede')->find($nuevo))
            ),
            'estado' => $this->textoCambio(
                $etiqueta,
                $equipo->estado?->label(),
                EstadoEquipo::tryFrom($nuevo)?->label() ?? $nuevo
            ),
            'tipo_uso' => $this->textoCambio(
                $etiqueta,
                $equipo->tipo_uso?->label(),
                TipoUso::tryFrom($nuevo)?->label() ?? $nuevo
            ),
            default => $this->textoCambio($etiqueta, $equipo->{$campo}, $nuevo),
        };
    }

    private function textoCambio(string $etiqueta, mixed $antes, mixed $despues): string
    {
        $antes = ($antes === null || $antes === '') ? '(vacío)' : '"'.$antes.'"';

        return "{$etiqueta}: {$antes} → \"{$despues}\"";
    }

    private function rutaUbicacion(?UbicacionFormacion $ubicacion): ?string
    {
        if (!$ubicacion) {
            return null;
        }

        return implode(' / ', array_filter([
            $ubicacion->subsede?->sede?->nombre,
            $ubicacion->subsede?->nombre,
            $ubicacion->nombre,
        ]));
    }

    private function etiquetaCaracteristica(string $clave): string
    {
        return ucfirst(str_replace('_', ' ', $clave));
    }

    private function exigirCamposDeEquipoNuevo($validator, int|string $fila, array $datos): void
    {
        $obligatorios = [
            'serial' => 'Falta el serial (obligatorio para un equipo nuevo).',
            'tipo_de_equipo' => 'Falta el tipo de equipo (obligatorio para un equipo nuevo).',
            'sede' => 'Falta la sede (obligatoria para un equipo nuevo).',
            'subsede' => 'Falta la subsede (obligatoria para un equipo nuevo).',
            'ambiente' => 'Falta el ambiente (obligatorio para un equipo nuevo).',
        ];

        foreach ($obligatorios as $campo => $mensaje) {
            if (empty($datos[$campo])) {
                $validator->errors()->add($fila.'.'.$campo, $mensaje);
            }
        }
    }

    /**
     * Serial y MAC únicos en TODA la tabla (incluidos los eliminados, que
     * siguen ocupando su valor en la BD), excepto el propio equipo.
     */
    private function validarUnicos($validator, int|string $fila, array $datos, ?int $idPropio): void
    {
        $columnas = [
            'serial' => 'El serial ":valor" ya pertenece al equipo con placa :placa.',
            'mac' => 'La MAC ":valor" ya pertenece al equipo con placa :placa.',
            'mac_cableada' => 'La MAC cableada ":valor" ya pertenece al equipo con placa :placa.',
        ];

        foreach ($columnas as $columna => $mensaje) {
            $valor = $datos[$columna] ?? null;

            if ($valor === null) {
                continue;
            }

            $otraPlaca = Equipo::withTrashed()
                ->where($columna, $valor)
                ->when($idPropio, fn ($q) => $q->whereKeyNot($idPropio))
                ->value('placa_sena');

            if ($otraPlaca !== null) {
                $validator->errors()->add(
                    $fila.'.'.$columna,
                    strtr($mensaje, [':valor' => $valor, ':placa' => $otraPlaca])
                );
            }
        }
    }

    private function validarUbicacion($validator, int|string $fila, array $datos): void
    {
        $partes = [$datos['sede'] ?? null, $datos['subsede'] ?? null, $datos['ambiente'] ?? null];
        $llenas = count(array_filter($partes, fn ($valor) => !empty($valor)));

        if ($llenas === 0) {
            return; // equipo existente: conserva su ubicación (si es nuevo, ya se reportó)
        }

        if ($llenas < 3) {
            $validator->errors()->add(
                $fila.'.ambiente',
                'Para indicar la ubicación hay que llenar Sede, Subsede y Ambiente (los tres).'
            );

            return;
        }

        if (!$this->resolverUbicacion(...$partes)) {
            $validator->errors()->add(
                $fila.'.ambiente',
                "El ambiente \"{$datos['ambiente']}\" no existe dentro de {$datos['sede']} / {$datos['subsede']}."
            );
        }
    }

    /**
     * Clasifica la fila UNA sola vez: ¿repite la placa o el serial de una
     * fila anterior del archivo? Si sí, se omite (se procesa la primera).
     * Que el equipo ya exista en el sistema ya NO es motivo para omitir:
     * esas filas se actualizan.
     */
    private function clasificar(array $row, int $fila): void
    {
        if (isset($this->clasificadas[$fila])) {
            return;
        }

        $this->clasificadas[$fila] = true;

        $placa = $row['placa_sena'];
        $serial = $row['serial'];

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
    }

    /**
     * Equipo activo (no eliminado) con esa placa. Se guarda en caché para
     * no consultarlo dos veces (validación y guardado).
     */
    private function equipoExistente(?string $placa): ?Equipo
    {
        if ($placa === null) {
            return null;
        }

        $clave = mb_strtolower($placa);

        if (!array_key_exists($clave, $this->cacheExistentes)) {
            $this->cacheExistentes[$clave] = Equipo::where('placa_sena', $placa)->first() ?? false;
        }

        return $this->cacheExistentes[$clave] ?: null;
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
        $row['tipo_de_uso'] = NormalizadorEquipo::tipoUso($row['tipo_de_uso'] ?? null);

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
     * Si el cuentadante no existe, devuelve NULL: un equipo nuevo queda
     * sin asignar y uno existente conserva el que tenía.
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
     * Se descartan columnas sin encabezado, celdas vacías y las claves
     * internas "__..." (como __fila).
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