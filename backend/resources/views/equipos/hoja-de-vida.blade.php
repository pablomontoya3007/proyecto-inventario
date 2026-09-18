<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; margin-top: 20px; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background-color: #f1f5f9; }
        .datos-generales td:first-child { font-weight: bold; width: 35%; background-color: #f8fafc; }
    </style>
</head>
<body>
    <h1>Hoja de vida — {{ $equipo->placa_sena }}</h1>
    <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>

    <h2>Datos generales</h2>
    <table class="datos-generales">
        <tr><td>Placa SENA</td><td>{{ $equipo->placa_sena }}</td></tr>
        <tr><td>Serial</td><td>{{ $equipo->serial }}</td></tr>
        <tr><td>MAC</td><td>{{ $equipo->mac ?? '—' }}</td></tr>
        <tr><td>MAC cableada</td><td>{{ $equipo->mac_cableada ?? '—' }}</td></tr>
        <tr><td>Hostname</td><td>{{ $equipo->hostname ?? '—' }}</td></tr>
        <tr><td>Tipo de equipo</td><td>{{ $equipo->tipoEquipo?->nombre ?? '—' }}</td></tr>
        <tr><td>Estado</td><td>{{ $equipo->estado?->label() ?? '—' }}</td></tr>
        <tr><td>Responsable</td><td>{{ $equipo->responsable?->nombre ?? 'Sin asignar' }}</td></tr>
        <tr>
            <td>Ubicación actual</td>
            <td>
                {{ $equipo->ubicacionFormacion?->nombre ?? '—' }} /
                {{ $equipo->ubicacionFormacion?->subsede?->nombre ?? '—' }} /
                {{ $equipo->ubicacionFormacion?->subsede?->sede?->nombre ?? '—' }}
            </td>
        </tr>
    </table>

    @if ($equipo->caracteristicas_tecnicas)
        <h2>Características técnicas</h2>
        <table>
            @foreach ($equipo->caracteristicas_tecnicas as $campo => $valor)
                <tr><th>{{ $campo }}</th><td>{{ $valor }}</td></tr>
            @endforeach
        </table>
    @endif

    @if ($equipo->licenciaOffice)
        <h2>Licencia de Office</h2>
        <table class="datos-generales">
            <tr><td>Correo</td><td>{{ $equipo->licenciaOffice->correo }}</td></tr>
            <tr><td>Estado</td><td>{{ $equipo->licenciaOffice->estado_licencia?->label() ?? '—' }}</td></tr>
        </table>
    @endif

    <h2>Historial de mantenimientos</h2>
    @if ($equipo->mantenimientos->isEmpty())
        <p>Sin mantenimientos registrados.</p>
    @else
        <table>
            <thead>
                <tr><th>Fecha programada</th><th>Descripción</th><th>Estado</th><th>Fecha completado</th></tr>
            </thead>
            <tbody>
                @foreach ($equipo->mantenimientos as $mantenimiento)
                    <tr>
                        <td>{{ $mantenimiento->fecha_programada?->toDateString() }}</td>
                        <td>{{ $mantenimiento->descripcion ?? '—' }}</td>
                        <td>{{ $mantenimiento->estado?->label() }}</td>
                        <td>{{ $mantenimiento->fecha_completado?->toDateString() ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Historial de traslados</h2>
    @if ($equipo->traslados->isEmpty())
        <p>Sin traslados registrados.</p>
    @else
        <table>
            <thead>
                <tr><th>Fecha</th><th>Origen</th><th>Destino</th><th>Motivo</th></tr>
            </thead>
            <tbody>
                @foreach ($equipo->traslados as $traslado)
                    <tr>
                        <td>{{ $traslado->fecha_traslado?->toDateString() }}</td>
                        <td>{{ $traslado->ubicacionOrigen?->nombre ?? '—' }}</td>
                        <td>{{ $traslado->ubicacionDestino?->nombre ?? '—' }}</td>
                        <td>{{ $traslado->motivo ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Historial de observaciones</h2>
    @if ($equipo->observaciones->isEmpty())
        <p>Sin observaciones registradas.</p>
    @else
        <table>
            <thead>
                <tr><th>Fecha</th><th>Usuario</th><th>Descripción</th></tr>
            </thead>
            <tbody>
                @foreach ($equipo->observaciones as $observacion)
                    <tr>
                        <td>{{ $observacion->created_at?->format('d/m/Y H:i') }}</td>
                        <td>{{ $observacion->usuario?->name ?? '—' }}</td>
                        <td>{{ $observacion->descripcion }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
