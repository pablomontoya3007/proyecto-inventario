<?php

namespace App\Models;

use App\Enums\EstadoEquipo;
use Illuminate\Database\Eloquent\Builder;
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

    public function mantenimientos(): HasMany
    {
        return $this->hasMany(Mantenimiento::class)->latest('fecha_programada');
    }

    public function traslados(): HasMany
    {
        return $this->hasMany(Traslado::class)->latest('fecha_traslado');
    }

    /**
     * Filtra equipos por ubicación jerárquica (sede / subsede / ubicación
     * de formación). Mismo criterio que ya usaba EquipoController::index():
     * cada nivel se aplica de forma independiente si viene informado, sin
     * forzar "el más específico gana" aquí — esa precedencia ya la resuelve
     * el frontend antes de armar la query string (ver EquiposPage y ahora
     * ReportesPage), así que basta con encadenar el where/whereHas que
     * corresponda a cada parámetro presente.
     *
     * Se extrae como scope porque esta misma cadena ya vivía duplicada en
     * EquipoController::index() y ahora la necesita también
     * ReporteController, en tres formas distintas (query directa a Equipo,
     * whereHas desde LicenciaOffice, withCount desde Responsable). Tenerla
     * en un solo lugar evita que las tres terminen divergiendo con el
     * tiempo.
     */
    public function scopeFiltrarPorUbicacion(
        Builder $query,
        ?int $sedeId,
        ?int $subsedeId,
        ?int $ubicacionId
    ): Builder {
        return $query
            ->when($ubicacionId, fn (Builder $q) => $q->where('ubicacion_formacion_id', $ubicacionId))
            ->when(
                $subsedeId,
                fn (Builder $q) => $q->whereHas(
                    'ubicacionFormacion',
                    fn (Builder $sub) => $sub->where('subsede_id', $subsedeId)
                )
            )
            ->when(
                $sedeId,
                fn (Builder $q) => $q->whereHas(
                    'ubicacionFormacion.subsede',
                    fn (Builder $sub) => $sub->where('sede_id', $sedeId)
                )
            );
    }
}