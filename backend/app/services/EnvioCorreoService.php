<?php

namespace App\Services;

use App\Enums\EstadoCorreo;
use App\Mail\CorreoSistemaMail;
use App\Models\CorreoEnviado;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

/**
 * Único punto del sistema que envía correos. Lo usan la sección Correos,
 * las notificaciones de mantenimiento y las de novedades, para que TODOS
 * los envíos:
 * - salgan con el mismo formato (CorreoSistemaMail, Reply-To al usuario);
 * - queden en el historial de Correos, hayan salido o no;
 * - manejen los fallos igual (nunca lanzan excepción hacia el llamador:
 *   un correo que falla no debe deshacer el mantenimiento o la novedad
 *   que lo originó).
 */
class EnvioCorreoService
{
    public function enviar(User $remitente, array $destinatarios, string $asunto, string $cuerpo): CorreoEnviado
    {
        $destinatarios = collect($destinatarios)
            ->map(fn (string $correo) => mb_strtolower(trim($correo)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $mensaje = new CorreoSistemaMail(
            asunto: $asunto,
            cuerpo: $cuerpo,
            nombreRemitente: $remitente->name,
            correoRemitente: $remitente->email,
        );

        $estado = EstadoCorreo::Enviado;
        $error = null;

        try {
            $this->despachar($mensaje, $destinatarios);
        } catch (Throwable $excepcion) {
            report($excepcion);
            $estado = EstadoCorreo::Fallido;
            $error = Str::limit($excepcion->getMessage(), 1000);
        }

        return CorreoEnviado::create([
            'user_id' => $remitente->id,
            'asunto' => $asunto,
            'cuerpo' => $cuerpo,
            'destinatarios' => $destinatarios,
            'estado' => $estado,
            'error' => $error,
        ])->load('remitente');
    }

    /**
     * Resumen de UN envío para devolverle al frontend:
     * { estado: enviado|fallido|omitida, mensaje }. El mensaje nombra el
     * destinatario, porque una misma acción puede generar varios avisos
     * (ej. novedad: responsable + usuario asignado).
     */
    public function resumen(?CorreoEnviado $correo, string $motivoOmision = ''): array
    {
        if ($correo === null) {
            return ['estado' => 'omitida', 'mensaje' => $motivoOmision];
        }

        $para = implode(', ', $correo->destinatarios);

        return $correo->estado === EstadoCorreo::Enviado
            ? ['estado' => 'enviado', 'mensaje' => "Se notificó por correo a {$para}."]
            : [
                'estado' => 'fallido',
                'mensaje' => "No se pudo notificar a {$para}: quedó como fallido en Correos, desde donde se puede reintentar.",
            ];
    }

    /**
     * Un destinatario: va en "Para". Varios: en copia oculta, con la
     * propia cuenta del sistema en "Para", para que nadie vea los correos
     * de los demás.
     */
    private function despachar(CorreoSistemaMail $mensaje, array $destinatarios): void
    {
        if (count($destinatarios) === 1) {
            Mail::to($destinatarios[0])->send($mensaje);

            return;
        }

        Mail::to(config('mail.from.address'))
            ->bcc($destinatarios)
            ->send($mensaje);
    }
}