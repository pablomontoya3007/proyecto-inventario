<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $asunto }}</title>
</head>
<body style="margin:0; padding:24px; background-color:#f4f4f4; font-family:Arial, Helvetica, sans-serif; color:#1A1A1A;">
    {{-- Estilos en línea: la mayoría de clientes de correo (Gmail incluido)
         ignoran las hojas de estilo externas o en <style>. --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:6px; overflow:hidden;">
        <tr>
            <td style="height:6px; background-color:#39A900;"></td>
        </tr>
        <tr>
            <td style="padding:24px; font-size:14px; line-height:1.6;">
                {{-- e() escapa cualquier HTML que se haya escrito en el cuerpo
                     (nadie puede inyectar etiquetas o scripts); nl2br()
                     conserva los saltos de línea del texto original. --}}
                {!! nl2br(e($cuerpo)) !!}
            </td>
        </tr>
        <tr>
            <td style="padding:16px 24px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
                Enviado por {{ $nombreRemitente }} desde Inventario SENA.<br>
                Si respondes a este correo, tu respuesta le llegará a {{ $correoRemitente }}.
            </td>
        </tr>
    </table>
</body>
</html>