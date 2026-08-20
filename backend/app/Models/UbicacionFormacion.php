<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UbicacionFormacion extends Model
{
    use HasFactory, SoftDeletes;

    // Convención de Laravel pluralizaría "UbicacionFormacion" como
    // "ubicacion_formacions". La tabla real es "ubicaciones_formacion",
    // así que se declara explícita para no depender de esa adivinanza.
    protected $table = 'ubicaciones_formacion';

    protected $fillable = [
        'subsede_id',
        'nombre',
    ];

    public function subsede(): BelongsTo
    {
        return $this->belongsTo(Subsede::class);
    }

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class, 'ubicacion_formacion_id');
    }
}
