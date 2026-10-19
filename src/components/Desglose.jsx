import { catalogoApi } from '../api/endpoints';
import { CATEGORIA_LABEL, money, soloFecha } from '../utils/format';
import { useAsync } from '../utils/useAsync';

/** Desglose de cobro de un registro de visita, tal como lo guardó el backend. */
export function DesgloseRegistro({ registro }) {
  const gratis = registro.acompanantes?.filter((a) => !a.cobra_entrada).length || 0;
  const pagan = (registro.acompanantes?.length || 0) - gratis;

  // El detalle guardado no trae la categoría de edad; la obtenemos de la oferta del parque.
  const { data: ofertas } = useAsync(
    () => catalogoApi.productosDeParque(registro.parque_id, soloFecha(registro.fecha_visita)).catch(() => []),
    [registro.parque_id, registro.fecha_visita]
  );
  const categoriaDe = (ppId) => ofertas?.find((o) => o.parque_producto_id === ppId)?.categoria_edad;

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
            const cat = d.producto_tipo === 'ENTRADA' ? categoriaDe(d.parque_producto_id) : null;
            return (
              <tr key={d.id}>
                <td>
                  {d.producto_nombre}
                  {cat ? ` (${CATEGORIA_LABEL[cat]})` : ''}
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
