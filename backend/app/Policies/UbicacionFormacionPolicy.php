<?php

namespace App\Policies;

use App\Models\UbicacionFormacion;
use App\Models\User;

class UbicacionFormacionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, UbicacionFormacion $ubicacionFormacion): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, UbicacionFormacion $ubicacionFormacion): bool
    {
        return true;
    }

    public function delete(User $user, UbicacionFormacion $ubicacionFormacion): bool
    {
        return ! $ubicacionFormacion->equipos()->exists();
    }

    public function restore(User $user, UbicacionFormacion $ubicacionFormacion): bool
    {
        return true;
    }
}
