<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ResponsableRequest extends BaseFormRequest
{
    /**
     * CAMBIO DE REQUISITO: documento pasa de opcional a obligatorio —
     * es el identificador de la persona responsable (cédula), y la
     * migración 2026_09_30_000001 lo refuerza también en la BD.
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
        ];
    }

    public function messages(): array
    {
        return [
            'documento.required' => 'El documento es obligatorio.',
            'documento.unique' => 'Ya existe un responsable con este documento.',
        ];
    }
}