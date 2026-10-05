<?php

namespace App\Policies;

use App\Models\Novedad;
use App\Models\User;

/**
 * Sin roles todavía: cualquier usuario autenticado puede ver, reportar y
 * resolver novedades — mismo criterio que el resto del sistema. No hay
 * "delete": las novedades son historial.
 */
class NovedadPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Novedad $novedad): bool
    {
        return true;
    }
}