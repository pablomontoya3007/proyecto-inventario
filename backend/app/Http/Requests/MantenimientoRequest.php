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
            // Sube de 500 a 2000: al marcar "listo" se combina la
            // descripción original con la nota de cierre en el mismo
            // campo, así que puede superar el límite de una sola nota.
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'estado' => ['sometimes', Rule::enum(EstadoMantenimiento::class)],
            // Usuario del sistema que hará el mantenimiento (opcional).
            // Al programar, se le notifica por correo.
            'asignado_a' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'asignado_a.exists' => 'El usuario asignado ya no existe.',
        ];
    }
}