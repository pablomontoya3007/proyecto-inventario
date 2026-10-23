<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Cambio de cuentadante de uno o varios equipos.
 *
 * asignaciones: [{ equipo_id, responsable_id }, ...] — una por equipo, así
 * cada equipo puede ir a un cuentadante distinto (traslado "uno por uno")
 * o todos al mismo (traslado masivo): para el backend es lo mismo.
 *
 * Solo cuentadantes que ya existen (no se crean aquí) y solo equipos no
 * eliminados. max:500 es un tope de seguridad, no una regla de negocio.
 */
class TrasladoCuentadanteRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'asignaciones' => ['required', 'array', 'min:1', 'max:500'],
            'asignaciones.*.equipo_id' => [
                'required', 'integer', 'distinct',
                Rule::exists('equipos', 'id')->whereNull('deleted_at'),
            ],
            'asignaciones.*.responsable_id' => [
                'required', 'integer',
                Rule::exists('responsables', 'id')->whereNull('deleted_at'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'asignaciones.required' => 'Selecciona al menos un equipo.',
            'asignaciones.min' => 'Selecciona al menos un equipo.',
            'asignaciones.max' => 'No se pueden trasladar más de 500 equipos en un solo envío.',
            'asignaciones.*.equipo_id.distinct' => 'Hay equipos repetidos en la selección.',
            'asignaciones.*.equipo_id.exists' => 'Uno de los equipos seleccionados ya no existe.',
            'asignaciones.*.responsable_id.required' => 'Falta elegir el nuevo cuentadante de uno de los equipos.',
            'asignaciones.*.responsable_id.exists' => 'Uno de los cuentadantes elegidos ya no existe.',
        ];
    }
}