/**
 * Barras simples con CSS, sin librería de gráficos (recharts, chart.js,
 * etc.) — un reporte que solo compara unos pocos totales no justifica
 * sumar una dependencia nueva. Si más adelante se quiere algo más
 * vistoso, esto se reemplaza sin tocar el resto de la página.
 */
export function DesgloseCategoria({ titulo, filas, etiquetaClave = 'nombre', valorClave = 'total' }) {
  const maximo = Math.max(...filas.map((f) => f[valorClave]), 1);

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos.</p>
      ) : (
        <div className="space-y-2">
          {filas.map((fila, indice) => (
            <div key={indice}>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{fila[etiquetaClave]}</span>
                <span>{fila[valorClave]}</span>
              </div>
              <div className="h-2 w-full rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-slate-600"
                  style={{ width: `${(fila[valorClave] / maximo) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
