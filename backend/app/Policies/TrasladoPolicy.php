<?php

namespace App\Policies;

use App\Models\Traslado;
use App\Models\User;

class TrasladoPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Traslado $traslado): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    // Sin update ni delete: un traslado, una vez registrado, es un hecho
    // histórico — igual que Observacion. Un error de captura se corrige
    // con un traslado nuevo, no editando ni borrando el que ya pasó.
    public function update(User $user, Traslado $traslado): bool
    {
        return false;
    }

    public function delete(User $user, Traslado $traslado): bool
    {
        return false;
    }
}