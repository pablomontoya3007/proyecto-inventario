<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class SubsedeRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'sede_id' => ['required', 'integer', 'exists:sedes,id'],
            'nombre' => [
                'required',
                'string',
                'max:150',
                // Único DENTRO de la misma sede, no de forma global —
                // coincide con unique(['sede_id','nombre']) de la migración.
                Rule::unique('subsedes', 'nombre')
                    ->where(fn ($query) => $query->where('sede_id', $this->input('sede_id')))
                    ->ignore($this->route('subsede')),
            ],
        ];
    }
}
