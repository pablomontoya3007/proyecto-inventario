<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base común para los Form Requests del proyecto. Centraliza authorize():
 * como el sistema no maneja roles, cualquier usuario autenticado puede
 * ejecutar cualquier acción — el middleware de la ruta ya exige estar
 * logueado, así que aquí no hay una regla adicional que aplicar. Si más
 * adelante el proyecto necesita autorización más fina, las Policies (el
 * siguiente paso) son el lugar correcto para eso, no este método repetido
 * en cada Request.
 */
abstract class BaseFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
