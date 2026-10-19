import { Car, CreditCard, ShoppingBag, Star, Users } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { qrApi, visitasApi } from '../../api/endpoints';
import { DesgloseRegistro } from '../../components/Desglose';
import { QrBox } from '../../components/QrBox';
import { Alerta, Encabezado, ErrorApi, Estado, Loader, MarcaParque } from '../../components/ui';
import { fechaLarga, money, plural } from '../../utils/format';
import { temaParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

export default function DetalleRegistro() {
  const { id } = useParams();
  const location = useLocation();
  const { data, error, loading } = useAsync(async () => {
    const [registro, codigos, pedidos] = await Promise.all([
      visitasApi.registro(id),
      qrApi.misCodigos().catch(() => []),
      visitasApi.pedidosDeRegistro(id).catch(() => [])
    ]);
    const qr = codigos.find((c) => Number(c.registro_visita_id) === Number(id));
    return { registro, qr, pedidos };
  }, [id]);

  if (loading) return <Loader texto="Cargando el registro…" />;
  if (error) return <div className="pagina"><ErrorApi error={error} /></div>;

  const { registro, qr, pedidos } = data;
  const tema = temaParque({ nombre: registro.parque_nombre, codigo: registro.parque_codigo });
  const pendiente = registro.estado_pago === 'PENDIENTE';
  const activo = registro.estado_registro === 'ACTIVO';
  const entregado = qr?.estado === 'ENTREGADO';

  return (
    <div className="pagina" style={{ '--parque': tema.color, '--parque-suave': tema.suave }}>
      <Encabezado
        titulo={`Registro ${registro.codigo_registro}`}
        volver={{ to: '/cliente', texto: 'Mis visitas' }}
        acciones={<Estado valor={activo ? registro.estado_pago : 'CERRADO'} />}
      >
        <MarcaParque nombre={registro.parque_nombre} parque={{ codigo: registro.parque_codigo }} /> {fechaLarga(registro.fecha_visita)}
      </Encabezado>

      {location.state?.pagado && (
        <Alerta tipo="exito" titulo="¡Pago aprobado!">
          Tu QR ya está activo. Te enviamos un correo de confirmación. Preséntalo en taquilla el día de tu visita.
        </Alerta>
      )}

      <div className="dos-columnas dos-columnas--qr">
        <section className="panel panel--qr">
          <QrBox qr={qr || { estado: pendiente ? 'NO_DISPONIBLE' : 'NO_DISPONIBLE' }} titulo="QR de entrada y parqueo" />
          <ul className="datos-chips">
            <li><Users size={16} /> {plural(registro.total_personas, 'persona', 'personas')}</li>
            <li><Car size={16} /> {registro.tiene_vehiculo ? 'Con parqueo' : 'Sin vehículo'}</li>
          </ul>
          <div className="pila-botones">
            {pendiente && activo && (
              <Link to={`/cliente/visitas/${id}/pagar`} className="btn btn--primario btn--bloque btn--grande">
                <CreditCard size={18} /> Pagar {money(registro.total)}
              </Link>
            )}
            {activo && (
              <Link to={`/cliente/pedidos/nuevo?registro=${id}`} className="btn btn--secundario btn--bloque">
                <ShoppingBag size={18} /> Comprar brazaletes o tickets
              </Link>
            )}
            {entregado && (
              <Link to={`/cliente/visitas/${id}/calificar`} className="btn btn--secundario btn--bloque">
                <Star size={18} /> Calificar mi visita
              </Link>
            )}
          </div>
        </section>

        <section className="panel">
          <h2 className="panel__titulo">Desglose del cobro</h2>
          <DesgloseRegistro registro={registro} />

          {pedidos.length > 0 && (
            <>
              <h3 className="desglose__h">Pedidos de esta visita</h3>
              <ul className="movimientos movimientos--compacto">
                {pedidos.map((p) => (
                  <li key={p.id}>
                    <Link to={`/cliente/pedidos/${p.id}`} className="movimiento">
                      <span className="movimiento__titulo">{p.numero_pedido}</span>
                      <Estado valor={p.estado} />
                      <span className="movimiento__monto">{money(p.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
