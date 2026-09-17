<?php

namespace App\Http\Requests;

use App\Enums\EstadoMantenimiento;
use Illuminate\Validation\Rule;

class MantenimientoRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $actualizando = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'equipo_id' => [$actualizando ? 'sometimes' : 'required', 'integer', 'exists:equipos,id'],
            'fecha_programada' => [$actualizando ? 'sometimes' : 'required', 'date'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'estado' => ['sometimes', Rule::enum(EstadoMantenimiento::class)],
        ];
    }
}