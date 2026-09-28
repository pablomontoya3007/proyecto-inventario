<?php

namespace App\Models;

use App\Observers\AuditoriaObserver;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subsede extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'subsedes';

    protected $fillable = [
        'sede_id',
        'nombre',
    ];

    protected static function booted(): void
    {
        static::observe(AuditoriaObserver::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function ubicacionesFormacion(): HasMany
    {
        return $this->hasMany(UbicacionFormacion::class);
    }
}
