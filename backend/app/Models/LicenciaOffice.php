<?php

namespace App\Models;

use App\Enums\EstadoLicencia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicenciaOffice extends Model
{
    use HasFactory;

    protected $table = 'licencias_office';

    protected $fillable = [
        'equipo_id',
        'correo',
        'estado_licencia',
        'password_cifrado',
        'fecha_actualizacion',
    ];

    // Defensa adicional: nunca debe viajar en una respuesta JSON por
    // accidente, incluso si algún día alguien olvida usar un API Resource.
    protected $hidden = [
        'password_cifrado',
    ];

    protected function casts(): array
    {
        return [
            // Cast "encrypted": asignar $licencia->password_cifrado = 'texto plano'
            // la cifra automáticamente (AES-256 con APP_KEY) antes de guardar;
            // leerla la descifra. En ningún punto del código se maneja el
            // texto plano manualmente.
            'password_cifrado' => 'encrypted',
            'estado_licencia' => EstadoLicencia::class,
            'fecha_actualizacion' => 'date',
        ];
    }

    /**
     * Actualiza fecha_actualizacion automáticamente cada vez que cambia la
     * contraseña, para que ningún controlador tenga que acordarse de hacerlo.
     */
    protected static function booted(): void
    {
        static::saving(function (self $licencia) {
            if ($licencia->isDirty('password_cifrado')) {
                $licencia->fecha_actualizacion = now();
            }
        });
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }
}
