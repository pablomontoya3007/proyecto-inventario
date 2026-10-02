<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Sin roles todavía: cualquier usuario autenticado puede ver, crear y
 * editar usuarios — mismo criterio que el resto de Policies del
 * sistema. Solo la eliminación tiene reglas de negocio.
 *
 * Response::deny('...') en vez de false: el 403 viaja con un mensaje
 * concreto ({ message }) que el frontend muestra tal cual.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, User $usuario): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, User $usuario): bool
    {
        return true;
    }

    /**
     * - No a uno mismo: evita quedarse por fuera del sistema (o dejarlo
     *   sin ningún usuario si es el último).
     * - No si registró observaciones: observaciones.user_id usa
     *   restrictOnDelete — la BD lo rechazaría igual; así se responde
     *   con un mensaje claro en vez de un error 500.
     */
    public function delete(User $user, User $usuario): Response
    {
        if ($user->is($usuario)) {
            return Response::deny('No puedes eliminar tu propia cuenta.');
        }

        if ($usuario->observaciones()->exists()) {
            return Response::deny(
                'No se puede eliminar: este usuario registró observaciones y se perdería la trazabilidad.'
            );
        }

        return Response::allow();
    }
}