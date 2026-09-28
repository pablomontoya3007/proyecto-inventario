<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Registro histórico inmutable de cada creación/actualización/
 * eliminación en los modelos auditados (ver AuditoriaObserver y el
 * booted() de cada modelo). No lleva updated_at — una auditoría que se
 * pudiera editar dejaría de servir como auditoría, mismo criterio que
 * ya usa Observacion.
 */
class Auditoria extends Model
{
    protected $table = 'auditorias';

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'accion',
        'auditable_type',
        'auditable_id',
        'cambios',
    ];

    protected function casts(): array
    {
        return [
            'cambios' => 'array',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
