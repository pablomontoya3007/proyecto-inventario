<?php

namespace App\Models;

use App\Enums\EstadoLicencia;
use App\Observers\AuditoriaObserver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicenciaOffice extends Model
{
    use HasFactory;

    /**
     * Meses sin cambiar la contraseña a partir de los cuales una licencia
     * se considera "sin actualizar" (ver scopeSinActualizar). Para cambiar
     * la regla basta con editar este número.
     */
    public const MESES_SIN_ACTUALIZAR = 3;

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
     * contraseña O el correo, para que ningún controlador tenga que
     * acordarse de hacerlo. Cambiar solo el estado no cuenta: no es una
     * "actualización" de la licencia en sí, es un cambio de situación.
     */
    protected static function booted(): void
    {
        static::observe(AuditoriaObserver::class);

        static::saving(function (self $licencia) {
            if ($licencia->isDirty(['password_cifrado', 'correo'])) {
                $licencia->fecha_actualizacion = now();
            }
        });
    }

    /**
     * password_cifrado NUNCA se audita, ni siquiera cifrada — sería un
     * segundo lugar donde esta credencial podría quedar expuesta.
     */
    public function camposAuditablesExcluidos(): array
    {
        return ['password_cifrado'];
    }

    /**
     * Licencias con MÁS de N meses sin actualizarse: fecha_actualizacion
     * anterior a hoy menos N meses (exactamente N meses todavía no cuenta).
     * Una fecha vacía también se incluye — que nunca haya quedado
     * registrada es motivo de aviso, no algo que dejar pasar en silencio.
     *
     * fecha_actualizacion cambia cuando cambia la contraseña o el correo
     * (ver booted()) — no al editar solo el estado.
     */
    public function scopeSinActualizar(Builder $query, ?int $meses = null): Builder
    {
        $limite = now()->subMonthsNoOverflow($meses ?? self::MESES_SIN_ACTUALIZAR)->toDateString();

        return $query->where(function (Builder $q) use ($limite) {
            $q->where('fecha_actualizacion', '<', $limite)
                ->orWhereNull('fecha_actualizacion');
        });
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }
}