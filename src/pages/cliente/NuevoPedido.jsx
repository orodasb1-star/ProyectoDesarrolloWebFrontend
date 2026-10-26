import { Lock, Minus, PackageOpen, Plus, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { catalogoApi, visitasApi } from '../../api/endpoints';
import { Alerta, Boton, Encabezado, ErrorApi, Loader, Vacio } from '../../components/ui';
import { TIPO_PRODUCTO_LABEL, fechaLarga, money, soloFecha } from '../../utils/format';
import { temaParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

export default function NuevoPedido() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: registros, error, loading } = useAsync(() => visitasApi.registros(false), []);
  const registroId = Number(params.get('registro')) || null;
  const registro = registros?.find((r) => r.id === registroId);

  // Si solo hay un registro activo, lo seleccionamos directamente.
  useEffect(() => {
    if (!registroId && registros?.length === 1) setParams({ registro: String(registros[0].id) }, { replace: true });
  }, [registroId, registros, setParams]);

  const catalogo = useAsync(
    () => (registro ? catalogoApi.productosDeParque(registro.parque_id, soloFecha(registro.fecha_visita)) : Promise.resolve([])),
    [registro?.id]
  );
  const productos = (catalogo.data || []).filter((p) => p.tipo === 'BRAZALETE' || p.tipo === 'TICKET_JUEGO');

  const [cantidades, setCantidades] = useState({});
  const [cotizacion, setCotizacion] = useState(null);
  const [cotizando, setCotizando] = useState(false);
  const [errorCot, setErrorCot] = useState(null);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState(null);

  useEffect(() => {
    setCantidades({});
    setCotizacion(null);
  }, [registroId]);

  const items = Object.entries(cantidades)
    .filter(([, c]) => c > 0)
    .map(([id, c]) => ({ parque_producto_id: Number(id), cantidad: c }));
  const pagado = registro?.estado_pago === 'PAGADO';

  // Cotización en vivo del pedido calculada por el backend
  useEffect(() => {
    if (!registro || items.length === 0) {
      setCotizacion(null);
      return;
    }
    let cancel = false;
    setCotizando(true);
    const t = setTimeout(async () => {
      try {
        const c = await visitasApi.cotizarPedido(registro.id, items);
        if (!cancel) {
          setCotizacion(c);
          setErrorCot(null);
        }
      } catch (err) {
        if (!cancel) {
          setCotizacion(null);
          setErrorCot(err);
        }
      } finally {
        if (!cancel) setCotizando(false);
      }
    }, 200);

    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [registro?.id, JSON.stringify(items)]);

  function cambiar(id, delta) {
    setCantidades((c) => ({ ...c, [id]: Math.max(0, Math.min(50, (c[id] || 0) + delta)) }));
  }

  async function crear() {
    setErrorCrear(null);
    setCreando(true);
    try {
      const pedido = await visitasApi.crearPedido(registro.id, items);
      navigate(`/cliente/pedidos/${pedido.id}/pagar`, { replace: true });
    } catch (err) {
      setErrorCrear(err);
    } finally {
      setCreando(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="pagina">
      <Encabezado titulo="Nuevo pedido" volver={{ to: '/cliente/pedidos', texto: 'Mis pedidos' }}>
        Solo se muestran los brazaletes y tickets de juego del parque de tu visita.
      </Encabezado>
      <ErrorApi error={error} />

      {registros?.length === 0 && (
        <Vacio icono={Ticket} titulo="Necesitas una visita activa"
          accion={<Link className="btn btn--primario" to="/cliente/visitas/nueva">Registrar una visita</Link>}>
          Los pedidos se asocian a un registro de visita.
        </Vacio>
      )}

      {registros?.length > 0 && (
        <div className="campo">
          <label htmlFor="sel-registro">Visita</label>
          <select id="sel-registro" value={registroId || ''} onChange={(e) => setParams(e.target.value ? { registro: e.target.value } : {})}>
            <option value="">Elige la visita para este pedido</option>
            {registros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.parque_nombre}, {fechaLarga(r.fecha_visita, true)} ({r.codigo_registro})
              </option>
            ))}
          </select>
        </div>
      )}

      {registro && (
        <div className="con-resumen">
          <section className="panel">
            <h2 className="panel__titulo">Catálogo de {registro.parque_nombre}</h2>
            {catalogo.loading && <Loader />}
            <ErrorApi error={catalogo.error} />
            {!catalogo.loading && productos.length === 0 && (
              <Vacio icono={PackageOpen} titulo="Este parque no vende brazaletes ni tickets en línea">
                Para esta fecha no hay productos disponibles.
              </Vacio>
            )}
            <ul className="catalogo">
              {productos.map((p) => {
                const tema = temaParque({ nombre: registro.parque_nombre });
                const c = cantidades[p.parque_producto_id] || 0;
                return (
                  <li key={p.parque_producto_id} className="producto" style={{ '--parque': tema.color }}>
                    <div className="producto__info">
                      <span className="producto__tipo">{TIPO_PRODUCTO_LABEL[p.tipo]}</span>
                      <strong>{p.nombre}</strong>
                      {p.descripcion && <span className="texto-suave">{p.descripcion}</span>}
                    </div>
                    <span className="producto__precio">{money(p.precio)}</span>
                    <div className="contador">
                      <button type="button" aria-label={`Quitar ${p.nombre}`} onClick={() => cambiar(p.parque_producto_id, -1)} disabled={c === 0}>
                        <Minus size={16} />
                      </button>
                      <output aria-live="polite">{c}</output>
                      <button type="button" aria-label={`Agregar ${p.nombre}`} onClick={() => cambiar(p.parque_producto_id, 1)} disabled={c >= 50}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="resumen" style={{ '--parque': temaParque({ nombre: registro.parque_nombre }).color }}>
            <h2>Resumen</h2>
            {items.length === 0 ? (
              <p className="texto-suave">Agrega productos con los botones +.</p>
            ) : (
              <table className="resumen__tabla">
                <tbody>
                  {(cotizacion?.items || items).map((it) => {
                    const p = productos.find((x) => x.parque_producto_id === it.parque_producto_id);
                    return (
                      <tr key={it.parque_producto_id}>
                        <td>
                          {it.producto_nombre || p?.nombre}
                          <small> × {it.cantidad} a {money(it.precio_unitario || p?.precio)}</small>
                        </td>
                        <td>{it.subtotal ? money(it.subtotal) : '…'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {cotizacion?.total && (
                  <tfoot>
                    <tr><td>Total oficial</td><td>{money(cotizacion.total)}</td></tr>
                  </tfoot>
                )}
              </table>
            )}
            {cotizando && <p className="texto-suave resumen__nota">Calculando cotización oficial en el servidor…</p>}
            <ErrorApi error={errorCot} titulo="Error al cotizar pedido" />

            {!pagado && (
              <Alerta tipo="aviso" titulo="Primero paga tu entrada">
                Puedes comprar brazaletes cuando el registro de esta visita esté pagado.{' '}
                <Link to={`/cliente/visitas/${registro.id}/pagar`}>Pagar entrada</Link>
              </Alerta>
            )}
            <ErrorApi error={errorCrear} titulo="No se pudo crear el pedido" />
            <Boton className="btn--bloque btn--grande" onClick={crear} cargando={creando} disabled={!pagado || items.length === 0 || cotizando}
              title={!pagado ? 'Primero paga tu entrada' : undefined}>
              {!pagado && <Lock size={18} />} Ir a pagar pedido
            </Boton>
          </aside>
        </div>
      )}
    </div>
  );
}
