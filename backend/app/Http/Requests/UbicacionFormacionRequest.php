<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UbicacionFormacionRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'subsede_id' => ['required', 'integer', 'exists:subsedes,id'],
            'nombre' => [
                'required',
                'string',
                'max:150',
                // Único DENTRO de la misma subsede, mismo patrón que Subsede.
                Rule::unique('ubicaciones_formacion', 'nombre')
                    ->where(fn ($query) => $query->where('subsede_id', $this->input('subsede_id')))
                    ->ignore($this->route('ubicacion_formacion')),
            ],
        ];
    }
}
