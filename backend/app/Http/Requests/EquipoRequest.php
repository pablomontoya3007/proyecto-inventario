<?php

namespace App\Http\Requests;

use App\Enums\EstadoEquipo;
use App\Models\TipoEquipo;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;

class EquipoRequest extends BaseFormRequest
{
    private const FORMATO_MAC = '/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/';

    /**
     * Campos técnicos esperados por tipo de equipo. Es una guía, no una
     * restricción de base de datos: si un tipo no aparece aquí (como
     * "Otro dispositivo de conectividad") o el usuario manda campos de
     * más, no se rechaza nada — solo se avisa si falta algo esperado, sin
     * perder la flexibilidad que fue la razón de usar una columna JSON.
     */
    private const CAMPOS_POR_TIPO = [
        'Computador portátil' => ['procesador', 'ram_gb', 'almacenamiento', 'sistema_operativo', 'marca', 'modelo'],
        'Computador de escritorio' => ['procesador', 'ram_gb', 'almacenamiento', 'sistema_operativo', 'marca', 'modelo'],
        'Todo en uno' => ['procesador', 'ram_gb', 'almacenamiento', 'sistema_operativo', 'marca', 'modelo'],
        'Impresora' => ['marca', 'modelo', 'tipo'],
        'Access Point' => ['marca', 'modelo'],
        'Router' => ['marca', 'modelo'],
        'Switch' => ['marca', 'modelo', 'numero_puertos'],
    ];

    public function rules(): array
    {
        return [
            'placa_sena' => [
                'required', 'string', 'max:30',
                Rule::unique('equipos', 'placa_sena')->ignore($this->route('equipo')),
            ],
            'serial' => [
                'required', 'string', 'max:100',
                Rule::unique('equipos', 'serial')->ignore($this->route('equipo')),
            ],
            'mac' => [
                'nullable', 'string', 'regex:' . self::FORMATO_MAC,
                Rule::unique('equipos', 'mac')->ignore($this->route('equipo')),
            ],
            'mac_cableada' => [
                'nullable', 'string', 'regex:' . self::FORMATO_MAC,
                Rule::unique('equipos', 'mac_cableada')->ignore($this->route('equipo')),
            ],
            'hostname' => ['nullable', 'string', 'max:100'],
            'tipo_equipo_id' => ['required', 'integer', 'exists:tipos_equipo,id'],
            'responsable_id' => ['nullable', 'integer', 'exists:responsables,id'],
            'ubicacion_formacion_id' => ['required', 'integer', 'exists:ubicaciones_formacion,id'],
            'estado' => ['sometimes', Rule::enum(EstadoEquipo::class)],
            'caracteristicas_tecnicas' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'mac.regex' => 'El formato de la MAC debe ser AA:BB:CC:DD:EE:FF.',
            'mac_cableada.regex' => 'El formato de la MAC cableada debe ser AA:BB:CC:DD:EE:FF.',
        ];
    }

    /**
     * No encaja en rules() porque depende de dos campos a la vez
     * (tipo_equipo_id y caracteristicas_tecnicas). Se ejecuta después de
     * que las reglas básicas ya pasaron.
     */
    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$this->filled('tipo_equipo_id') || !$this->has('caracteristicas_tecnicas')) {
                return;
            }

            $tipo = TipoEquipo::find($this->input('tipo_equipo_id'));
            $camposEsperados = self::CAMPOS_POR_TIPO[$tipo?->nombre] ?? null;

            if ($camposEsperados === null) {
                return;
            }

            $camposRecibidos = array_keys($this->input('caracteristicas_tecnicas', []));
            $faltantes = array_diff($camposEsperados, $camposRecibidos);

            if ($faltantes !== []) {
                $validator->errors()->add(
                    'caracteristicas_tecnicas',
                    'Para "' . $tipo->nombre . '" normalmente se esperan estos campos: ' . implode(', ', $faltantes) . '.'
                );
            }
        });
    }
}
