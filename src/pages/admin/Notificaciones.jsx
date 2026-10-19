import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { reportesApi } from '../../api/endpoints';
import { AvisoEndpoint, Encabezado, ErrorApi, Estado, Loader, Vacio } from '../../components/ui';
import { fechaHora } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

const TIPO_NOTIF = {
  PAGO_REGISTRO: 'Pago de entrada',
  PAGO_PEDIDO: 'Pago de pedido',
  QR_ENTREGADO: 'Entrega en taquilla'
};

export default function Notificaciones() {
  const [estado, setEstado] = useState('FALLIDO');
  const { data, error, loading } = useAsync(() => reportesApi.notificaciones(estado), [estado]);
  const lista = Array.isArray(data) ? data : data?.notificaciones || [];

  return (
    <div className="pagina">
      <Encabezado titulo="Notificaciones">Correos de confirmación de pago y de entrega en taquilla.</Encabezado>
      <div className="pestanas" role="tablist">
        {[['FALLIDO', 'Fallidas'], ['ENVIADO', 'Enviadas'], ['PENDIENTE', 'Pendientes']].map(([k, t]) => (
          <button key={k} role="tab" aria-selected={estado === k} className={estado === k ? 'activa' : ''} onClick={() => setEstado(k)}>{t}</button>
        ))}
      </div>
      {loading && <Loader />}
      {error?.status === 404 ? (
        <AvisoEndpoint ruta="GET /api/reportes/notificaciones?estado=FALLIDO"
          descripcion="La tabla NOTIFICACIONES existe, pero ningún servicio la expone por HTTP." />
      ) : (
        <ErrorApi error={error} />
      )}
      {data && lista.length === 0 && (
        <Vacio icono={MailCheck} titulo={estado === 'FALLIDO' ? 'No hay correos fallidos' : 'Nada por aquí'}>
          {estado === 'FALLIDO' ? 'Todos los correos se enviaron correctamente.' : 'No hay notificaciones en este estado.'}
        </Vacio>
      )}
      {lista.length > 0 && (
        <div className="panel panel--tabla tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Destinatario</th><th>Tipo</th><th>Estado</th><th>Error</th></tr></thead>
            <tbody>
              {lista.map((nt) => (
                <tr key={nt.id}>
                  <td>{fechaHora(nt.created_at)}</td>
                  <td>{nt.destinatario || nt.email || nt.usuario_id}</td>
                  <td>{TIPO_NOTIF[nt.tipo] || nt.tipo}</td>
                  <td><Estado valor={nt.estado} /></td>
                  <td className="texto-suave">{nt.error || nt.mensaje_error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
