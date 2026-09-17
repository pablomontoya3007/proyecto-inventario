<?php

namespace App\Models;

use App\Enums\EstadoMantenimiento;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mantenimiento extends Model
{
    use HasFactory;

    protected $table = 'mantenimientos';

    protected $fillable = [
        'equipo_id',
        'fecha_programada',
        'descripcion',
        'estado',
        'fecha_completado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_programada' => 'date',
            'fecha_completado' => 'date',
            'estado' => EstadoMantenimiento::class,
        ];
    }

    /**
     * Sella fecha_completado sola, en cuanto el estado pasa a "listo" —
     * mismo patrón que fecha_actualizacion en LicenciaOffice::booted().
     * Nunca se acepta fecha_completado desde el cliente (no está en
     * MantenimientoRequest a propósito).
     */
    protected static function booted(): void
    {
        static::saving(function (self $mantenimiento) {
            if ($mantenimiento->isDirty('estado') && $mantenimiento->estado === EstadoMantenimiento::Listo) {
                $mantenimiento->fecha_completado = now();
            }
        });
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }
}