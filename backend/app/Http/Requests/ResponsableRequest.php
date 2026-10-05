<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ResponsableRequest extends BaseFormRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        if (is_string($this->input('correo'))) {
            $this->merge(['correo' => mb_strtolower(trim($this->input('correo')))]);
        }
    }

    /**
     * CAMBIO DE REQUISITO: documento pasa de opcional a obligatorio —
     * es el identificador de la persona responsable (cédula), y la
     * migración 2026_09_30_000001 lo refuerza también en la BD.
     *
     * NUEVO: correo (opcional) — destino de las notificaciones de
     * novedades de los equipos a su cargo.
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'documento' => [
                'required',
                'string',
                'max:30',
                Rule::unique('responsables', 'documento')->ignore($this->route('responsable')),
            ],
            'cargo' => ['nullable', 'string', 'max:100'],
            'correo' => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'documento.required' => 'El documento es obligatorio.',
            'documento.unique' => 'Ya existe un responsable con este documento.',
            'correo.email' => 'El correo no tiene un formato válido.',
            'correo.max' => 'El correo no puede superar 255 caracteres.',
        ];
    }
}