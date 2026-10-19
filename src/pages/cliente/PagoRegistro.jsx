import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { pagosApi, visitasApi } from '../../api/endpoints';
import { DesgloseRegistro } from '../../components/Desglose';
import { FormularioPago } from '../../components/FormularioPago';
import { Alerta, Encabezado, ErrorApi, Loader, MarcaParque } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fechaLarga } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

export default function PagoRegistro() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: registro, error, loading } = useAsync(() => visitasApi.registro(id), [id]);

  if (loading) return <Loader texto="Cargando tu registro…" />;
  if (error) return <div className="pagina"><ErrorApi error={error} /></div>;
  if (registro.estado_pago === 'PAGADO') return <Navigate to={`/cliente/visitas/${id}`} replace />;

  async function pagar(payload) {
    await pagosApi.pagarRegistro(id, payload);
    navigate(`/cliente/visitas/${id}`, { replace: true, state: { pagado: true } });
  }

  return (
    <div className="pagina">
      <Encabezado titulo="Pago del registro" volver={{ to: `/cliente/visitas/${id}`, texto: 'Detalle del registro' }}>
        <MarcaParque nombre={registro.parque_nombre} parque={{ codigo: registro.parque_codigo }} /> {fechaLarga(registro.fecha_visita)}
      </Encabezado>

      {location.state?.recienCreado && (
        <Alerta tipo="info" titulo="Registro creado con pago pendiente">
          Tu QR se activa en cuanto pagues. Si prefieres, puedes pagar después desde Mis visitas.
        </Alerta>
      )}

      <div className="dos-columnas">
        <section className="panel">
          <h2 className="panel__titulo">Método de pago</h2>
          <FormularioPago monto={registro.total} onPagar={pagar} emailSugerido={usuario?.email} />
        </section>
        <section className="panel panel--suave">
          <h2 className="panel__titulo">Tu registro {registro.codigo_registro}</h2>
          <DesgloseRegistro registro={registro} />
        </section>
      </div>
    </div>
  );
}
