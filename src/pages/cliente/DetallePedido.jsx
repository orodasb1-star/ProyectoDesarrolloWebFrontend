import { CreditCard, Lock } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { pagosApi, qrApi, visitasApi } from '../../api/endpoints';
import { FormularioPago } from '../../components/FormularioPago';
import { QrBox } from '../../components/QrBox';
import { Alerta, Encabezado, ErrorApi, Estado, Loader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { TIPO_PRODUCTO_LABEL, fechaHora, fechaLarga, money } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

function TablaPedido({ pedido }) {
  return (
    <table className="resumen__tabla">
      <tbody>
        {pedido.detalles.map((d) => (
          <tr key={d.id}>
            <td>
              {d.producto_nombre}
              <small> {TIPO_PRODUCTO_LABEL[d.producto_tipo]}, {d.cantidad} × {money(d.precio_unitario)}</small>
            </td>
            <td>{money(d.subtotal)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td>Total</td><td>{money(pedido.total)}</td></tr>
      </tfoot>
    </table>
  );
}

function usePedido(id) {
  return useAsync(async () => {
    const [pedido, codigos] = await Promise.all([visitasApi.pedido(id), qrApi.misCodigos().catch(() => [])]);
    return { pedido, qr: codigos.find((c) => Number(c.pedido_id) === Number(id)) };
  }, [id]);
}

export function DetallePedido() {
  const { id } = useParams();
  const location = useLocation();
  const { data, error, loading } = usePedido(id);

  if (loading) return <Loader texto="Cargando el pedido…" />;
  if (error) return <div className="pagina"><ErrorApi error={error} /></div>;
  const { pedido, qr } = data;
  const registroPagado = pedido.registro_estado_pago === 'PAGADO';

  return (
    <div className="pagina">
      <Encabezado titulo={`Pedido ${pedido.numero_pedido}`} volver={{ to: '/cliente/pedidos', texto: 'Mis pedidos' }}
        acciones={<Estado valor={pedido.estado} />}>
        Para tu visita del {fechaLarga(pedido.fecha_visita)}. Creado el {fechaHora(pedido.created_at)}.
      </Encabezado>

      {location.state?.pagado && (
        <Alerta tipo="exito" titulo="¡Pago aprobado!">Muestra este QR en taquilla para recibir tus productos.</Alerta>
      )}

      <div className="dos-columnas dos-columnas--qr">
        <section className="panel panel--qr">
          <QrBox qr={qr || { estado: 'NO_DISPONIBLE' }} titulo="QR del pedido" />
          {pedido.estado === 'PENDIENTE' && (
            registroPagado ? (
              <Link to={`/cliente/pedidos/${id}/pagar`} className="btn btn--primario btn--bloque btn--grande">
                <CreditCard size={18} /> Pagar {money(pedido.total)}
              </Link>
            ) : (
              <>
                <button className="btn btn--primario btn--bloque btn--grande" disabled>
                  <Lock size={18} /> Pagar
                </button>
                <Alerta tipo="aviso" titulo="Primero paga tu entrada">
                  <Link to={`/cliente/visitas/${pedido.registro_visita_id}/pagar`}>Ir a pagar la entrada</Link>
                </Alerta>
              </>
            )
          )}
        </section>
        <section className="panel">
          <h2 className="panel__titulo">Productos</h2>
          <TablaPedido pedido={pedido} />
          <Link to={`/cliente/visitas/${pedido.registro_visita_id}`} className="enlace-flecha">Ver registro de la visita</Link>
        </section>
      </div>
    </div>
  );
}

export function PagoPedido() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading } = usePedido(id);

  if (loading) return <Loader texto="Cargando el pedido…" />;
  if (error) return <div className="pagina"><ErrorApi error={error} /></div>;
  const { pedido } = data;
  if (pedido.estado !== 'PENDIENTE') return <Navigate to={`/cliente/pedidos/${id}`} replace />;
  const registroPagado = pedido.registro_estado_pago === 'PAGADO';

  async function pagar(payload) {
    await pagosApi.pagarPedido(id, payload);
    navigate(`/cliente/pedidos/${id}`, { replace: true, state: { pagado: true } });
  }

  return (
    <div className="pagina">
      <Encabezado titulo="Pago del pedido" volver={{ to: `/cliente/pedidos/${id}`, texto: pedido.numero_pedido }} />
      <div className="dos-columnas">
        <section className="panel">
          <h2 className="panel__titulo">Método de pago</h2>
          {registroPagado ? (
            <FormularioPago monto={pedido.total} onPagar={pagar} emailSugerido={usuario?.email} />
          ) : (
            <Alerta tipo="aviso" titulo="Primero paga tu entrada">
              El pedido se puede pagar cuando el registro de la visita esté pagado.{' '}
              <Link to={`/cliente/visitas/${pedido.registro_visita_id}/pagar`}>Pagar entrada</Link>
            </Alerta>
          )}
        </section>
        <section className="panel panel--suave">
          <h2 className="panel__titulo">{pedido.numero_pedido}</h2>
          <TablaPedido pedido={pedido} />
        </section>
      </div>
    </div>
  );
}
