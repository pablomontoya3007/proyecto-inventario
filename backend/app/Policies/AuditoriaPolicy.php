<?php

namespace App\Policies;

use App\Models\Auditoria;
use App\Models\User;

/**
 * Solo lectura: la auditoría se llena sola (AuditoriaObserver), nunca
 * se crea ni se edita a través del API — por eso esta Policy solo
 * define viewAny.
 */
class AuditoriaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }
}
