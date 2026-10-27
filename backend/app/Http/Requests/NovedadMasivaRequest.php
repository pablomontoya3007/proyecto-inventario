<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Novedad masiva: la MISMA descripción registrada en varios equipos a la
 * vez (p. ej. varios equipos de un ambiente con el mismo daño).
 *
 * equipo_ids: los equipos marcados en el frontend. max:500 es un tope de
 * seguridad, no una regla de negocio.
 *
 * user_id no se valida: quien reporta es siempre el usuario autenticado.
 */
class NovedadMasivaRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'equipo_ids' => ['required', 'array', 'min:1', 'max:500'],
            'equipo_ids.*' => [
                'required', 'integer', 'distinct',
                Rule::exists('equipos', 'id')->whereNull('deleted_at'),
            ],
            'descripcion' => ['required', 'string', 'min:5', 'max:2000'],
            'asignado_a' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'equipo_ids.required' => 'Selecciona al menos un equipo.',
            'equipo_ids.min' => 'Selecciona al menos un equipo.',
            'equipo_ids.max' => 'No se pueden registrar más de 500 novedades en un solo envío.',
            'equipo_ids.*.distinct' => 'Hay equipos repetidos en la selección.',
            'equipo_ids.*.exists' => 'Uno de los equipos seleccionados ya no existe.',
            'descripcion.required' => 'Describe la novedad.',
            'descripcion.min' => 'La descripción debe tener al menos 5 caracteres.',
            'descripcion.max' => 'La descripción no puede superar 2000 caracteres.',
            'asignado_a.exists' => 'El usuario asignado ya no existe.',
        ];
    }
}