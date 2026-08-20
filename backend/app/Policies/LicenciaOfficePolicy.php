<?php

namespace App\Policies;

use App\Models\LicenciaOffice;
use App\Models\User;

class LicenciaOfficePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LicenciaOffice $licenciaOffice): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, LicenciaOffice $licenciaOffice): bool
    {
        return true;
    }

    public function delete(User $user, LicenciaOffice $licenciaOffice): bool
    {
        return true;
    }
}
