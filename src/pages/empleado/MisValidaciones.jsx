import { ClipboardList } from 'lucide-react';
import { qrApi } from '../../api/endpoints';
import { Alerta, Encabezado, Estado, Loader, MarcaParque, Vacio } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fechaHora, hoyGuatemala } from '../../utils/format';
import { leerValidaciones } from '../../utils/validacionesLocales';
import { useAsync } from '../../utils/useAsync';

const esDeHoy = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date(iso)) === hoyGuatemala();

export default function MisValidaciones() {
  const { usuario } = useAuth();
  // Intenta el endpoint propuesto; si no existe, usa el registro local de este dispositivo.
  const { data, loading } = useAsync(async () => {
    try {
      const remotas = await qrApi.misValidaciones(hoyGuatemala());
      return { origen: 'servidor', lista: remotas };
    } catch {
      return { origen: 'local', lista: leerValidaciones(usuario?.id).filter((v) => esDeHoy(v.fecha)) };
    }
  }, [usuario?.id]);

  const lista = data?.lista || [];
  const ok = lista.filter((v) => v.resultado === 'VALIDADO_ENTREGADO').length;

  return (
    <div className="pagina pagina--angosta">
      <Encabezado titulo="Mis validaciones de hoy">
        {ok} entregados y {lista.length - ok} rechazados.
      </Encabezado>
      {loading && <Loader />}
      {data?.origen === 'local' && (
        <Alerta tipo="info">
          Mostrando lo validado desde este dispositivo. El historial completo de taquilla lo verá el administrador en reportes.
        </Alerta>
      )}
      {!loading && lista.length === 0 && (
        <Vacio icono={ClipboardList} titulo="Aún no has validado códigos hoy">Los códigos que valides aparecerán aquí.</Vacio>
      )}
      <ul className="movimientos">
        {lista.map((v, i) => (
          <li key={i} className="movimiento">
            <span className="movimiento__info">
              <span className="movimiento__titulo movimiento__titulo--texto">{v.titular || `QR #${v.codigo_qr_id}`}</span>
              <span className="movimiento__sub">
                {v.tipo === 'PEDIDO' ? 'Pedido' : 'Entrada'}, {fechaHora(v.fecha || v.fecha_validacion)}
                {v.resultado === 'RECHAZADO' && v.referencia ? `. ${v.referencia}` : ''}
              </span>
            </span>
            {v.parque && <MarcaParque nombre={v.parque} tamano="sm" />}
            <Estado valor={v.resultado === 'VALIDADO_ENTREGADO' ? 'ENTREGADO' : 'RECHAZADO'} />
          </li>
        ))}
      </ul>
    </div>
  );
}
