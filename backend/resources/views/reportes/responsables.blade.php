<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        h1 { font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background-color: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Responsables con más equipos asignados — SPY Inventario SENA</h1>
    <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>

    <table>
        <thead><tr><th>Responsable</th><th>Equipos asignados</th></tr></thead>
        <tbody>
            @foreach ($top as $fila)
                <tr><td>{{ $fila['nombre'] }}</td><td>{{ $fila['total'] }}</td></tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>