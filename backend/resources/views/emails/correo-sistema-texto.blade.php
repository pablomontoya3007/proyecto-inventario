{{-- Versión en texto plano: {!! !!} porque aquí no hay HTML que
     interpretar, y escapar convertiría comillas y "&" en entidades. --}}
{!! $cuerpo !!}

--
Enviado por {!! $nombreRemitente !!} desde Inventario SENA.
Si respondes a este correo, tu respuesta le llegará a {!! $correoRemitente !!}.