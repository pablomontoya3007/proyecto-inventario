<?php

namespace App\Models;

use App\Observers\AuditoriaObserver;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sede extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sedes';

    protected $fillable = [
        'nombre',
    ];

    protected static function booted(): void
    {
        static::observe(AuditoriaObserver::class);
    }

    public function subsedes(): HasMany
    {
        return $this->hasMany(Subsede::class);
    }
}
