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
        /* Con muchas columnas, letra algo menor para que quepa en la hoja. */
        .listado th, .listado td { font-size: 10px; padding: 4px 5px; word-break: break-all; }
        /* La placa (primera columna) nunca se parte en dos líneas. */
        .listado td:first-child { white-space: nowrap; word-break: normal; }
    </style>
</head>
<body>
    <h1>Reporte de Equipos — Inventario SENA</h1>
    <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>

    <h2>Equipos por sede</h2>
    <table>
        <thead><tr><th>Sede</th><th>Total</th></tr></thead>
        <tbody>
            @foreach ($por_sede as $fila)
                <tr><td>{{ $fila->nombre }}</td><td>{{ $fila->total }}</td></tr>
            @endforeach
        </tbody>
    </table>

    <h2>Equipos por tipo</h2>
    <table>
        <thead><tr><th>Tipo de equipo</th><th>Total</th></tr></thead>
        <tbody>
            @foreach ($por_tipo as $fila)
                <tr><td>{{ $fila->nombre }}</td><td>{{ $fila->total }}</td></tr>
            @endforeach
        </tbody>
    </table>

    <h2>Equipos por estado</h2>
    <table>
        <thead><tr><th>Estado</th><th>Total</th></tr></thead>
        <tbody>
            @foreach ($por_estado as $fila)
                <tr><td>{{ $fila['estado'] }}</td><td>{{ $fila['total'] }}</td></tr>
            @endforeach
        </tbody>
    </table>

    <h2>Listado de equipos</h2>
    <table class="listado">
        <thead>
            <tr>
                @foreach ($columnas as $columna)
                    <th>{{ $columna['etiqueta'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($listado as $fila)
                <tr>
                    @foreach ($fila as $valor)
                        <td>{{ $valor }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>