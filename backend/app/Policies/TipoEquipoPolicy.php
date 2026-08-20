<?php

namespace App\Policies;

use App\Models\TipoEquipo;
use App\Models\User;

class TipoEquipoPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TipoEquipo $tipoEquipo): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, TipoEquipo $tipoEquipo): bool
    {
        return true;
    }

    /**
     * Este catálogo no tiene soft delete (se "apaga" con `activo`), así
     * que borrar aquí sí sería un DELETE físico real — y ahí el
     * restrictOnDelete de la migración lo bloquearía de todas formas, pero
     * como un QueryException feo de MySQL. Esta regla da un 403 claro
     * antes de llegar a ese punto.
     */
    public function delete(User $user, TipoEquipo $tipoEquipo): bool
    {
        return ! $tipoEquipo->equipos()->exists();
    }
}
