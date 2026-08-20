<?php

namespace App\Policies;

use App\Models\Equipo;
use App\Models\User;

class EquipoPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Equipo $equipo): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Equipo $equipo): bool
    {
        return true;
    }

    // Equipo es una "hoja" en la jerarquía: nada más depende de él salvo
    // su licencia y sus observaciones, y ambas se manejan solas
    // (cascadeOnDelete). No hay una regla de negocio que proteger aquí.
    public function delete(User $user, Equipo $equipo): bool
    {
        return true;
    }

    public function restore(User $user, Equipo $equipo): bool
    {
        return true;
    }
}
