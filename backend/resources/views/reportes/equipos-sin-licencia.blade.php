<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 11px; }
        h1 { font-size: 18px; }
        h2 { font-size: 14px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 5px 6px; text-align: left; }
        th { background-color: #f1f5f9; }
        .nota { color: #64748b; }
    </style>
</head>
<body>
    <h1>Equipos sin licencia de Office — Inventario SENA</h1>
    <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>
    <p class="nota">Solo equipos en uso: no se incluyen equipos de baja ni extraviados.</p>
    <p><strong>Total de equipos sin licencia:</strong> {{ $total }}</p>

    <h2>Por tipo de equipo</h2>
    <table>
        <thead><tr><th>Tipo de equipo</th><th>Total</th></tr></thead>
        <tbody>
            @forelse ($por_tipo as $fila)
                <tr><td>{{ $fila['nombre'] }}</td><td>{{ $fila['total'] }}</td></tr>
            @empty
                <tr><td colspan="2">No hay equipos sin licencia para este filtro.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Listado de equipos</h2>
    <table>
        <thead>
            <tr>
                <th>Placa SENA</th>
                <th>Hostname</th>
                <th>Tipo</th>
                <th>Cuentadante</th>
                <th>Sede</th>
                <th>Subsede</th>
                <th>Ubicación</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($listado as $fila)
                <tr>
                    <td>{{ $fila['placa_sena'] }}</td>
                    <td>{{ $fila['hostname'] }}</td>
                    <td>{{ $fila['tipo'] }}</td>
                    <td>{{ $fila['responsable'] }}</td>
                    <td>{{ $fila['sede'] }}</td>
                    <td>{{ $fila['subsede'] }}</td>
                    <td>{{ $fila['ubicacion'] }}</td>
                    <td>{{ $fila['estado'] }}</td>
                </tr>
            @empty
                <tr><td colspan="8">No hay equipos sin licencia para este filtro.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>