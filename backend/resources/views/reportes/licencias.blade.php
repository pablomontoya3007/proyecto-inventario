<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        h1 { font-size: 18px; }
        h2 { font-size: 14px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background-color: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Reporte de Licencias de Office — SPY Inventario SENA</h1>
    <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>

    <h2>Licencias por estado</h2>
    <table>
        <thead><tr><th>Estado</th><th>Total</th></tr></thead>
        <tbody>
            @foreach ($por_estado as $fila)
                <tr><td>{{ $fila['estado'] }}</td><td>{{ $fila['total'] }}</td></tr>
            @endforeach
        </tbody>
    </table>

    <h2>Requieren atención (vencidas o suspendidas)</h2>
    <table>
        <thead><tr><th>Equipo</th><th>Correo</th><th>Estado</th><th>Última actualización</th></tr></thead>
        <tbody>
            @foreach ($requieren_atencion as $fila)
                <tr>
                    <td>{{ $fila['equipo'] }}</td>
                    <td>{{ $fila['correo'] }}</td>
                    <td>{{ $fila['estado'] }}</td>
                    <td>{{ $fila['fecha_actualizacion'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>