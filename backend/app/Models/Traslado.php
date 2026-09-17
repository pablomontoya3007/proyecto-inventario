<?php

namespace App\Models;

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
}