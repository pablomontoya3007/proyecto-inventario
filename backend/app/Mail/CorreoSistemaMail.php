<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Correo redactado por un usuario desde el sistema.
 *
 * - Remitente (From): la cuenta Gmail del sistema (MAIL_FROM_ADDRESS).
 * - Responder a (Reply-To): el usuario que lo redactó, para que las
 *   respuestas le lleguen a él y no al buzón del sistema.
 * - Se envía en HTML y en texto plano: ayuda a que no caiga en spam.
 *
 * Las propiedades públicas quedan disponibles en las vistas.
 */
class CorreoSistemaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $asunto,
        public string $cuerpo,
        public string $nombreRemitente,
        public string $correoRemitente,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->asunto,
            replyTo: [new Address($this->correoRemitente, $this->nombreRemitente)],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.correo-sistema',
            text: 'emails.correo-sistema-texto',
        );
    }
}