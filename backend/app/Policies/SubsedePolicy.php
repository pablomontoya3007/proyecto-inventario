<?php

namespace App\Policies;

use App\Models\Subsede;
use App\Models\User;

class SubsedePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Subsede $subsede): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Subsede $subsede): bool
    {
        return true;
    }

    public function delete(User $user, Subsede $subsede): bool
    {
        return ! $subsede->ubicacionesFormacion()->exists();
    }

    public function restore(User $user, Subsede $subsede): bool
    {
        return true;
    }
}
