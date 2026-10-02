<?php

namespace App\Models;

use App\Enums\EstadoCorreo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CorreoEnviado extends Model
{
    protected $table = 'correos_enviados';

    protected $fillable = [
        'user_id',
        'asunto',
        'cuerpo',
        'destinatarios',
        'estado',
        'error',
    ];

    protected function casts(): array
    {
        return [
            'destinatarios' => 'array',
            'estado' => EstadoCorreo::class,
        ];
    }

    /**
     * Quien redactó el correo en el sistema (no la cuenta remitente
     * técnica, que siempre es la cuenta Gmail configurada en .env).
     */
    public function remitente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}