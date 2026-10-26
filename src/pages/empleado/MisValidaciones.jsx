import { ClipboardList } from 'lucide-react';
import { qrApi } from '../../api/endpoints';
import { Encabezado, ErrorApi, Estado, Loader, MarcaParque, Vacio } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fechaHora, hoyGuatemala } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

export default function MisValidaciones() {
  const { usuario } = useAuth();
  const { data: lista, error, loading } = useAsync(
    () => qrApi.misValidaciones(hoyGuatemala()),
    [usuario?.id]
  );

  const items = Array.isArray(lista) ? lista : [];
  const ok = items.filter((v) => v.resultado === 'VALIDADO_ENTREGADO').length;

  return (
    <div className="pagina pagina--angosta">
      <Encabezado titulo="Mis validaciones de hoy">
        {ok} entregados y {items.length - ok} rechazados. Registro oficial de taquilla.
      </Encabezado>
      {loading && <Loader />}
      <ErrorApi error={error} />
      {!loading && !error && items.length === 0 && (
        <Vacio icono={ClipboardList} titulo="Aún no has validado códigos hoy">
          Los códigos que valides aparecerán aquí directamente del servidor.
        </Vacio>
      )}
      <ul className="movimientos">
        {items.map((v, i) => (
          <li key={i} className="movimiento">
            <span className="movimiento__info">
              <span className="movimiento__titulo movimiento__titulo--texto">{v.titular || `QR #${v.codigo_qr_id}`}</span>
              <span className="movimiento__sub">
                {v.tipo === 'PEDIDO' ? 'Pedido' : 'Entrada'}, {fechaHora(v.fecha_validacion || v.fecha)}
                {v.resultado === 'RECHAZADO' && v.referencia ? `. Motivo: ${v.referencia}` : ''}
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
