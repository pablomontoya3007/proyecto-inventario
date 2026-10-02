<?php

namespace App\Policies;

use App\Models\CorreoEnviado;
use App\Models\User;

/**
 * Sin roles todavía: cualquier usuario autenticado puede ver el
 * historial y enviar correos — mismo criterio que el resto del sistema.
 * El historial es inmutable: no hay update ni delete.
 */
class CorreoEnviadoPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }
}