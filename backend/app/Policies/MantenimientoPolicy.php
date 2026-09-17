<?php

namespace App\Policies;

use App\Models\Mantenimiento;
use App\Models\User;

class MantenimientoPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Mantenimiento $mantenimiento): bool { return true; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Mantenimiento $mantenimiento): bool { return true; }
    public function delete(User $user, Mantenimiento $mantenimiento): bool { return true; }
}