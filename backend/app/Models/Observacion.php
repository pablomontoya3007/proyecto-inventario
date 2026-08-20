<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class Observacion extends Model
{
    use HasFactory;

    protected $table = 'observaciones';

    // No existe columna updated_at: la migración solo definió created_at,
    // porque las observaciones son un registro histórico que se crea y
    // nunca se modifica.
    const UPDATED_AT = null;

    protected $fillable = [
        'equipo_id',
        'user_id',
        'descripcion',
    ];

    /**
     * Refuerza la inmutabilidad a nivel de modelo, no solo por convención:
     * si algo intenta editar o borrar una observación (un controlador mal
     * escrito, un seeder, una sesión de tinker), la regla de negocio se
     * respeta desde un único lugar en vez de confiar en que nadie la rompa.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('Las observaciones son inmutables: no se editan, se crea una nueva.');
        });

        static::deleting(function () {
            throw new LogicException('Las observaciones son inmutables: no se pueden eliminar.');
        });
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
