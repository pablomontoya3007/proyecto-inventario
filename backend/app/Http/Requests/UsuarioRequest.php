<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Los campos se llaman "nombre" y "correo" (no name/email) para ser
 * consistentes con UserResource, que ya expone esos nombres al
 * frontend. El controlador los traduce a las columnas reales.
 *
 * Contraseña: obligatoria al crear; al editar es opcional (vacía =
 * conservar la actual — ConvertEmptyStringsToNull la convierte en null
 * y "nullable" la deja pasar). "confirmed" exige password_confirmation.
 */
class UsuarioRequest extends BaseFormRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        if (is_string($this->input('correo'))) {
            $this->merge(['correo' => mb_strtolower(trim($this->input('correo')))]);
        }
    }

    public function rules(): array
    {
        $actualizando = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'nombre' => ['required', 'string', 'max:255'],
            'correo' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($this->route('usuario')),
            ],
            'password' => [$actualizando ? 'nullable' : 'required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.max' => 'El nombre no puede superar 255 caracteres.',
            'correo.required' => 'El correo es obligatorio.',
            'correo.email' => 'El correo no tiene un formato válido.',
            'correo.unique' => 'Ya existe un usuario con este correo.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ];
    }
}