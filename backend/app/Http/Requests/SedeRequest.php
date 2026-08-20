<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class SedeRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => [
                'required',
                'string',
                'max:150',
                // ->ignore($this->route('sede')): en PUT /sedes/{sede},
                // route('sede') ya es la instancia de Sede resuelta por el
                // binding implícito de Laravel, así que puede "chocar" con
                // su propio nombre sin ser rechazada al editar.
                Rule::unique('sedes', 'nombre')->ignore($this->route('sede')),
            ],
        ];
    }
}
