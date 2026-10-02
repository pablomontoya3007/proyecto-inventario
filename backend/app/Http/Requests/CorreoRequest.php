<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\Validator;

/**
 * Destinatarios en dos listas, ambas opcionales (pero al menos una con
 * algo):
 * - usuario_ids: usuarios del sistema (el correo se resuelve aquí, en
 *   el backend, no se confía en el que mande el cliente).
 * - correos: direcciones escritas a mano.
 *
 * MAX_DESTINATARIOS = 100: límite de Gmail para destinatarios por
 * mensaje enviado por SMTP.
 */
class CorreoRequest extends BaseFormRequest
{
    public const MAX_DESTINATARIOS = 100;

    private ?array $destinatariosResueltos = null;

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $correos = $this->input('correos');

        if (is_array($correos)) {
            $this->merge([
                'correos' => array_map(
                    fn ($correo) => is_string($correo) ? mb_strtolower(trim($correo)) : $correo,
                    $correos
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'usuario_ids' => ['sometimes', 'array'],
            'usuario_ids.*' => ['integer', 'distinct', 'exists:users,id'],
            'correos' => ['sometimes', 'array', 'max:' . self::MAX_DESTINATARIOS],
            'correos.*' => ['string', 'email', 'max:255'],
            'asunto' => ['required', 'string', 'max:200'],
            'cuerpo' => ['required', 'string', 'max:10000'],
        ];
    }

    public function messages(): array
    {
        return [
            'usuario_ids.*.exists' => 'Uno de los usuarios seleccionados ya no existe.',
            'correos.max' => 'No se pueden agregar más de ' . self::MAX_DESTINATARIOS . ' destinatarios.',
            'correos.*.email' => 'Uno de los correos escritos no tiene un formato válido.',
            'asunto.required' => 'El asunto es obligatorio.',
            'asunto.max' => 'El asunto no puede superar 200 caracteres.',
            'cuerpo.required' => 'El mensaje no puede estar vacío.',
            'cuerpo.max' => 'El mensaje no puede superar 10.000 caracteres.',
        ];
    }

    /**
     * Reglas que dependen de las dos listas a la vez: que haya al menos
     * un destinatario y que el total (sin repetidos) no pase el límite.
     */
    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $total = count($this->destinatarios());

            if ($total === 0) {
                $validator->errors()->add('destinatarios', 'Agrega al menos un destinatario.');
            } elseif ($total > self::MAX_DESTINATARIOS) {
                $validator->errors()->add(
                    'destinatarios',
                    'No se pueden enviar más de ' . self::MAX_DESTINATARIOS . " destinatarios por correo (hay {$total})."
                );
            }
        });
    }

    /**
     * Lista final de direcciones: correos de los usuarios elegidos +
     * correos escritos, en minúsculas y sin repetidos (un usuario
     * elegido y su correo escrito a mano cuentan una sola vez).
     */
    public function destinatarios(): array
    {
        if ($this->destinatariosResueltos !== null) {
            return $this->destinatariosResueltos;
        }

        $usuarioIds = array_filter((array) $this->input('usuario_ids', []), 'is_numeric');

        $deUsuarios = $usuarioIds === []
            ? []
            : User::whereIn('id', $usuarioIds)->pluck('email')->all();

        $escritos = array_filter((array) $this->input('correos', []), 'is_string');

        return $this->destinatariosResueltos = collect([...$deUsuarios, ...$escritos])
            ->map(fn (string $correo) => mb_strtolower(trim($correo)))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}