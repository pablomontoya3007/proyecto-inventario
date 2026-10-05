<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * user_id NO se valida aquí a propósito: quien reporta la novedad es
 * siempre el usuario autenticado (lo pone el Controller), igual que en
 * Observaciones.
 *
 * asignado_a: usuario del sistema que debe revisarla (opcional).
 */
class NovedadRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'equipo_id' => [
                'required', 'integer',
                Rule::exists('equipos', 'id')->whereNull('deleted_at'),
            ],
            'descripcion' => ['required', 'string', 'min:5', 'max:2000'],
            'asignado_a' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'equipo_id.required' => 'Elige el equipo de la novedad.',
            'equipo_id.exists' => 'El equipo elegido ya no existe.',
            'descripcion.required' => 'Describe la novedad.',
            'descripcion.min' => 'La descripción debe tener al menos 5 caracteres.',
            'descripcion.max' => 'La descripción no puede superar 2000 caracteres.',
            'asignado_a.exists' => 'El usuario asignado ya no existe.',
        ];
    }
}