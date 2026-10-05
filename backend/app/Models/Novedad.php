<?php

namespace App\Models;

use App\Enums\EstadoNovedad;
use App\Observers\AuditoriaObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Novedad extends Model
{
    protected $table = 'novedades';

    protected $fillable = [
        'equipo_id',
        'user_id',
        'descripcion',
        'estado',
        'asignado_a',
        'nota_resolucion',
        'resuelta_por',
        'resuelta_en',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoNovedad::class,
            'resuelta_en' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::observe(AuditoriaObserver::class);
    }

    /**
     * withTrashed: si el equipo se elimina (soft delete), la novedad
     * sigue mostrando a qué placa pertenecía.
     */
    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class)->withTrashed();
    }

    // Quien la reportó: siempre el usuario autenticado al crearla.
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Usuario del sistema asignado para revisarla.
    public function asignado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asignado_a');
    }

    public function resueltaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resuelta_por');
    }
}