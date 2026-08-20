<?php

namespace App\Http\Requests;

use App\Enums\EstadoLicencia;
use Illuminate\Validation\Rule;

class LicenciaOfficeRequest extends BaseFormRequest
{
    public function rules(): array
    {
        // Obligatoria al crear, opcional al editar (si no se manda, se
        // conserva la actual). Se llama "password" a propósito, no
        // "password_cifrado" — ese nombre es de almacenamiento interno;
        // quien llena el formulario escribe una contraseña normal, y el
        // Controller es quien traduce un nombre al otro.
        $actualizando = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'equipo_id' => [
                'required', 'integer', 'exists:equipos,id',
                Rule::unique('licencias_office', 'equipo_id')->ignore($this->route('licencia_office')),
            ],
            'correo' => ['required', 'email', 'max:150'],
            'password' => [$actualizando ? 'sometimes' : 'required', 'string', 'min:8'],
            'estado_licencia' => ['sometimes', Rule::enum(EstadoLicencia::class)],
        ];
    }
}
