<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class MantenimientoMasivoRequest extends BaseFormRequest
{
    /**
     * equipo_ids: los equipos que quedaron MARCADOS en el frontend
     * (todos los de la ubicación menos los que se desmarcaron).
     *
     * max:500 es un tope de seguridad, no una regla de negocio.
     *
     * asignado_a: usuario del sistema que hará el mantenimiento — se
     * guarda en cada registro y recibe UN correo con todos los equipos.
     */
    public function rules(): array
    {
        return [
            'equipo_ids' => ['required', 'array', 'min:1', 'max:500'],
            'equipo_ids.*' => [
                'required', 'integer', 'distinct',
                Rule::exists('equipos', 'id')->whereNull('deleted_at'),
            ],
            'fecha_programada' => ['required', 'date'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'asignado_a' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'equipo_ids.required' => 'Selecciona al menos un equipo.',
            'equipo_ids.min' => 'Selecciona al menos un equipo.',
            'equipo_ids.max' => 'No se pueden programar más de 500 mantenimientos en un solo envío.',
            'equipo_ids.*.distinct' => 'Hay equipos repetidos en la selección.',
            'equipo_ids.*.exists' => 'Uno de los equipos seleccionados ya no existe.',
            'fecha_programada.required' => 'La fecha del mantenimiento es obligatoria.',
            'fecha_programada.date' => 'La fecha del mantenimiento no es válida.',
            'descripcion.max' => 'La descripción no puede superar 2000 caracteres.',
            'asignado_a.exists' => 'El usuario asignado ya no existe.',
        ];
    }
}