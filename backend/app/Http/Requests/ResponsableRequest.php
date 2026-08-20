<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ResponsableRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'documento' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('responsables', 'documento')->ignore($this->route('responsable')),
            ],
            'cargo' => ['nullable', 'string', 'max:100'],
        ];
    }
}
