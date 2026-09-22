<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Traslado extends Model
{
    use HasFactory;

    protected $table = 'traslados';

    protected $fillable = [
        'equipo_id',
        'ubicacion_origen_id',
        'ubicacion_destino_id',
        'fecha_traslado',
        'motivo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_traslado' => 'date',
        ];
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }

    public function ubicacionOrigen(): BelongsTo
    {
        return $this->belongsTo(UbicacionFormacion::class, 'ubicacion_origen_id');
    }

    public function ubicacionDestino(): BelongsTo
    {
        return $this->belongsTo(UbicacionFormacion::class, 'ubicacion_destino_id');
    }

    /**
     * A diferencia de Equipo, un Traslado no "pertenece" a una sola
     * ubicación: tiene una de origen y otra de destino. Coincide con el
     * filtro si CUALQUIERA de las dos cae dentro de la sede/subsede/
     * ubicación pedida. Este scope se autoprotege (no-op si los tres
     * parámetros vienen vacíos), así que se puede llamar directo desde
     * el Controller sin envolverlo en un when() adicional.
     */
    public function scopeFiltrarPorUbicacion(
        Builder $query,
        ?int $sedeId,
        ?int $subsedeId,
        ?int $ubicacionId
    ): Builder {
        if (!$sedeId && !$subsedeId && !$ubicacionId) {
            return $query;
        }

        $idsUbicacion = UbicacionFormacion::query()
            ->when($ubicacionId, fn (Builder $q) => $q->where('id', $ubicacionId))
            ->when(!$ubicacionId && $subsedeId, fn (Builder $q) => $q->where('subsede_id', $subsedeId))
            ->when(
                !$ubicacionId && !$subsedeId && $sedeId,
                fn (Builder $q) => $q->whereHas('subsede', fn (Builder $s) => $s->where('sede_id', $sedeId))
            )
            ->pluck('id');

        return $query->where(
            fn (Builder $q) => $q->whereIn('ubicacion_origen_id', $idsUbicacion)
                ->orWhereIn('ubicacion_destino_id', $idsUbicacion)
        );
    }
}