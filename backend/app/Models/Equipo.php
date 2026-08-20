<?php

namespace App\Models;

use App\Enums\EstadoEquipo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'equipos';

    protected $fillable = [
        'placa_sena',
        'serial',
        'mac',
        'mac_cableada',
        'hostname',
        'tipo_equipo_id',
        'responsable_id',
        'ubicacion_formacion_id',
        'estado',
        'caracteristicas_tecnicas',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoEquipo::class,
            // JSON <-> array de PHP de forma transparente. La validación de
            // qué claves son válidas según tipoEquipo vive en el Form
            // Request, no aquí.
            'caracteristicas_tecnicas' => 'array',
        ];
    }

    public function tipoEquipo(): BelongsTo
    {
        return $this->belongsTo(TipoEquipo::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Responsable::class);
    }

    // El nombre del método coincide con la convención de Laravel para
    // inferir la FK "ubicacion_formacion_id" automáticamente.
    public function ubicacionFormacion(): BelongsTo
    {
        return $this->belongsTo(UbicacionFormacion::class);
    }

    public function licenciaOffice(): HasOne
    {
        return $this->hasOne(LicenciaOffice::class);
    }

    public function observaciones(): HasMany
    {
        return $this->hasMany(Observacion::class)->latest('created_at');
    }
}
