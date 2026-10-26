import { CATEGORIA_LABEL, money } from '../utils/format';

/** Desglose de cobro de un registro de visita, provisto directamente por el backend. */
export function DesgloseRegistro({ registro }) {
  const gratis = registro.acompanantes?.filter((a) => !a.cobra_entrada).length || 0;
  const pagan = (registro.acompanantes?.length || 0) - gratis;

  return (
    <div className="desglose">
      <h3>Personas</h3>
      <ul className="desglose__personas">
        {registro.acompanantes?.map((a, i) => (
          <li key={a.id}>
            <span>
              {i + 1}. {a.es_titular ? 'Titular' : 'Acompañante'}, {a.edad} años
            </span>
            <span className="desglose__cat">{CATEGORIA_LABEL[a.categoria_tarifa]}</span>
            <span className={a.cobra_entrada ? '' : 'gratis'}>{a.cobra_entrada ? 'Paga' : 'Carnet'}</span>
          </li>
        ))}
      </ul>
      {registro.tiene_carnet && (
        <p className="texto-suave">
          {gratis} entran por carnet y {pagan} pagan entrada.
        </p>
      )}

      <h3>Cobro</h3>
      <table className="resumen__tabla">
        <tbody>
          {registro.detalles?.map((d) => {
            const cat = d.categoria_edad || (d.producto_tipo === 'ENTRADA' ? d.categoria_tarifa : null);
            return (
              <tr key={d.id}>
                <td>
                  {d.producto_nombre}
                  {cat && cat !== 'UNICA' ? ` (${CATEGORIA_LABEL[cat] || cat})` : ''}
                  <small> × {d.cantidad} a {money(d.precio_unitario)}</small>
                </td>
                <td>{money(d.subtotal)}</td>
              </tr>
            );
          })}
          {registro.detalles?.length === 0 && (
            <tr>
              <td colSpan={2} className="texto-suave">Sin cargos: todas las entradas las cubre el carnet.</td>
            </tr>
          )}
          <tr className="sub"><td>Subtotal entradas</td><td>{money(registro.subtotal_entrada)}</td></tr>
          <tr className="sub"><td>Subtotal parqueo</td><td>{money(registro.subtotal_parqueo)}</td></tr>
        </tbody>
        <tfoot>
          <tr><td>Total</td><td>{money(registro.total)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}
