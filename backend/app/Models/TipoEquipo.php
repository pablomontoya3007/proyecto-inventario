<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoEquipo extends Model
{
    use HasFactory;

    // Sin SoftDeletes a propósito: este catálogo se "apaga" con la columna
    // `activo` en vez de borrarse, para no mezclar dos mecanismos de baja
    // distintos dentro del mismo modelo.
    protected $table = 'tipos_equipo';

    protected $fillable = [
        'nombre',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }
}
