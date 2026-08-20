<?php

namespace App\Policies;

use App\Models\Sede;
use App\Models\User;

class SedePolicy
{
    // Sin roles: cualquier usuario autenticado puede ver, crear y editar.
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Sede $sede): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Sede $sede): bool
    {
        return true;
    }

    /**
     * subsedes() ya excluye las subsedes con soft delete (SoftDeletes
     * agrega ese filtro automáticamente a la relación), así que esto solo
     * mira subsedes activas — es justo la pregunta de negocio correcta.
     */
    public function delete(User $user, Sede $sede): bool
    {
        return ! $sede->subsedes()->exists();
    }

    public function restore(User $user, Sede $sede): bool
    {
        return true;
    }
}
