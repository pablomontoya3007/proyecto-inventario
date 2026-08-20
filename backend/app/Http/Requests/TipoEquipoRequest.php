<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class TipoEquipoRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tipos_equipo', 'nombre')->ignore($this->route('tipo_equipo')),
            ],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
