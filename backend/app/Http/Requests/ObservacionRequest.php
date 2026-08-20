<?php

namespace App\Http\Requests;

class ObservacionRequest extends BaseFormRequest
{
    /**
     * Solo existe para CREAR observaciones — el modelo Observacion ya
     * bloquea cualquier intento de editarlas, así que nunca va a hacer
     * falta una versión de esta clase para actualizar.
     *
     * A propósito NO se valida user_id aquí: quién registra la
     * observación lo determina el usuario autenticado en el Controller
     * (auth()->id()), nunca un valor que venga del cliente. Si se
     * aceptara desde el request, cualquiera podría atribuirle una
     * observación a otra persona.
     */
    public function rules(): array
    {
        return [
            'equipo_id' => ['required', 'integer', 'exists:equipos,id'],
            'descripcion' => ['required', 'string', 'min:5', 'max:1000'],
        ];
    }
}
