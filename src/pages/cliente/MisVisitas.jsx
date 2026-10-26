import { History, PlusCircle, ReceiptText, TicketX } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { visitasApi } from '../../api/endpoints';
import { Boleto } from '../../components/Boleto';
import { Encabezado, ErrorApi, Loader, Vacio } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../utils/useAsync';

export default function MisVisitas() {
  const { usuario } = useAuth();
  const [historial, setHistorial] = useState(false);
  const { data: registros, error, loading } = useAsync(() => visitasApi.registros(historial), [historial]);

  return (
    <div className="pagina">
      <Encabezado titulo={`Hola${usuario?.nombres ? `, ${usuario.nombres.split(' ')[0]}` : ''}`}>
        {usuario?.carnet
          ? `Tienes carnet de afiliado (${usuario.carnet}). Las primeras personas de tu grupo entran gratis.`
          : 'Aquí están tus visitas. Paga tu entrada y presenta el QR en taquilla.'}
      </Encabezado>

      <div className="acciones-grandes">
        <Link to="/cliente/visitas/nueva" className="accion-grande accion-grande--primaria">
          <PlusCircle size={28} />
          <span>
            <strong>Nueva visita</strong>
            <small>Elige parque, fecha y quiénes van</small>
          </span>
        </Link>
        <Link to="/cliente/pedidos" className="accion-grande">
          <ReceiptText size={28} />
          <span>
            <strong>Mis pedidos</strong>
            <small>Brazaletes y tickets</small>
          </span>
        </Link>
        <Link to="/cliente/historial" className="accion-grande">
          <History size={28} />
          <span>
            <strong>Mi historial completo</strong>
            <small>Visitas, pedidos y estados</small>
          </span>
        </Link>
      </div>

      <div className="pestanas" role="tablist">
        <button role="tab" aria-selected={!historial} className={!historial ? 'activa' : ''} onClick={() => setHistorial(false)}>
          Activas
        </button>
        <button role="tab" aria-selected={historial} className={historial ? 'activa' : ''} onClick={() => setHistorial(true)}>
          Historial completo
        </button>
      </div>

      {loading && <Loader texto="Cargando tus visitas…" />}
      <ErrorApi error={error} />
      {!loading && !error && registros?.length === 0 && (
        <Vacio
          icono={TicketX}
          titulo={historial ? 'Aún no tienes visitas registradas' : 'No tienes visitas activas'}
          accion={<Link to="/cliente/visitas/nueva" className="btn btn--primario">Planear una visita</Link>}
        >
          Registra tu próxima visita y paga en línea para entrar sin hacer cola.
        </Vacio>
      )}
      <div className="lista-boletos">
        {registros?.map((r) => (
          <Boleto key={r.id} registro={r} />
        ))}
      </div>
    </div>
  );
}
