<?php

namespace App\Policies;

use App\Models\Observacion;
use App\Models\User;

class ObservacionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Observacion $observacion): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    /**
     * App\Models\Observacion::booted() ya lanza una LogicException si algo
     * intenta editarla o borrarla. Bloquear también aquí no es redundante:
     * así el Controller responde con un 403 normal, claro, ANTES de
     * intentar la operación — en vez de dejar que llegue al modelo y
     * explote como una excepción de servidor sin manejar. Dos capas, cada
     * una útil desde un punto de entrada distinto: esta protege el flujo
     * HTTP normal; la del modelo protege contra cualquier otro código que
     * toque el modelo directo (un seeder, tinker, un comando futuro).
     */
    public function update(User $user, Observacion $observacion): bool
    {
        return false;
    }

    public function delete(User $user, Observacion $observacion): bool
    {
        return false;
    }
}
