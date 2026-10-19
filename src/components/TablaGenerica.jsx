/** Tabla que pinta cualquier arreglo de objetos (útil para reportes cuyo formato aún no está definido). */
export function TablaGenerica({ filas }) {
  if (!Array.isArray(filas) || filas.length === 0) return <p className="texto-suave">Sin datos para este filtro.</p>;
  const columnas = Object.keys(filas[0]);
  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c}>{c.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {columnas.map((c) => (
                <td key={c}>{typeof f[c] === 'object' && f[c] !== null ? JSON.stringify(f[c]) : String(f[c] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Convierte la respuesta de un reporte desconocido en una lista de filas. */
export function aFilas(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const arr = Object.values(data).find(Array.isArray);
    if (arr) return arr;
    return [data];
  }
  return [];
}
