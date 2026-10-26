import { PlusCircle, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { visitasApi } from '../../api/endpoints';
import { Encabezado, ErrorApi, Estado, Loader, Vacio } from '../../components/ui';
import { fechaHora, money } from '../../utils/format';
import { colorParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

/**
 * Usa GET /visitas/pedidos. Si el backend aún no tiene esa ruta (404), arma la lista
 * juntando los pedidos de cada registro del historial (GET /registros/:id/pedidos).
 */
async function cargarPedidos() {
  return await visitasApi.misPedidos();
}

function mesDe(fecha) {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-GT', { month: 'long', year: 'numeric', timeZone: 'America/Guatemala' });
}

export default function MisPedidos() {
  const { data: pedidos, error, loading } = useAsync(cargarPedidos, []);

  const grupos = [];
  pedidos?.forEach((p) => {
    const mes = mesDe(p.created_at);
    const g = grupos.find((x) => x.mes === mes);
    if (g) g.items.push(p);
    else grupos.push({ mes, items: [p] });
  });

  return (
    <div className="pagina">
      <Encabezado
        titulo="Mis pedidos"
        volver={{ to: '/cliente', texto: 'Mis visitas' }}
        acciones={
          <Link to="/cliente/pedidos/nuevo" className="btn btn--primario">
            <PlusCircle size={18} /> Nuevo pedido
          </Link>
        }
      >
        Brazaletes y tickets de juego que compraste para tus visitas.
      </Encabezado>

      {loading && <Loader texto="Cargando tus pedidos…" />}
      <ErrorApi error={error} />
      {!loading && !error && pedidos.length === 0 && (
        <Vacio icono={ReceiptText} titulo="Todavía no tienes pedidos"
          accion={<Link to="/cliente/pedidos/nuevo" className="btn btn--primario">Hacer un pedido</Link>}>
          Compra brazaletes o tickets de juego para el parque de tu visita.
        </Vacio>
      )}

      {grupos.map((g) => (
        <section key={g.mes} className="estado-cuenta">
          <h2 className="estado-cuenta__mes">{g.mes}</h2>
          <ul className="movimientos">
            {g.items.map((p) => (
              <li key={p.id}>
                <Link to={`/cliente/pedidos/${p.id}`} className="movimiento" style={{ '--parque': colorParque(p.parque_nombre) }}>
                  <span className="movimiento__barra" />
                  <span className="movimiento__info">
                    <span className="movimiento__titulo">{p.numero_pedido}</span>
                    <span className="movimiento__sub">
                      {p.parque_nombre}, {fechaHora(p.created_at)}
                    </span>
                  </span>
                  <Estado valor={p.estado} />
                  <span className="movimiento__monto">{money(p.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
