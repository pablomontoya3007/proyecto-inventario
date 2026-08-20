<?php

namespace App\Policies;

use App\Models\Responsable;
use App\Models\User;

class ResponsablePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Responsable $responsable): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Responsable $responsable): bool
    {
        return true;
    }

    /**
     * Sin restricción a propósito: equipo.responsable_id ya usa
     * nullOnDelete (ver migración de equipos). Si el responsable se va,
     * sus equipos quedan sin asignar automáticamente — es un escenario
     * normal (alguien deja el cargo), no algo que haya que bloquear.
     */
    public function delete(User $user, Responsable $responsable): bool
    {
        return true;
    }

    public function restore(User $user, Responsable $responsable): bool
    {
        return true;
    }
}
