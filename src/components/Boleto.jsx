import { Car, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fechaLarga, money, plural, soloFecha, hoyGuatemala } from '../utils/format';
import { temaParque } from '../utils/parques';
import { Estado } from './ui';

/** Tarjeta de un registro de visita con forma de boleto perforado. */
export function Boleto({ registro }) {
  const tema = temaParque({ nombre: registro.parque_nombre, codigo: registro.parque_codigo });
  const pagado = registro.estado_pago === 'PAGADO';
  const esHoy = soloFecha(registro.fecha_visita) === hoyGuatemala();

  return (
    <article className="boleto" style={{ '--parque': tema.color, '--parque-suave': tema.suave }}>
      <div className="boleto__principal">
        <div className="boleto__cabeza">
          <h3>{registro.parque_nombre}</h3>
          {esHoy && registro.estado_registro === 'ACTIVO' && <span className="boleto__hoy">Hoy</span>}
        </div>
        <p className="boleto__fecha">{fechaLarga(registro.fecha_visita)}</p>
        <ul className="boleto__datos">
          <li>
            <Users size={16} /> {plural(registro.total_personas, 'persona', 'personas')}
          </li>
          {registro.tiene_vehiculo && (
            <li>
              <Car size={16} /> Con parqueo
            </li>
          )}
          {registro.tiene_carnet && <li className="boleto__carnet">Con carnet</li>}
        </ul>
        <p className="boleto__codigo">{registro.codigo_registro}</p>
      </div>
      <div className="boleto__talon">
        <Estado valor={registro.estado_registro === 'CERRADO' ? 'CERRADO' : registro.estado_pago} />
        <strong className="boleto__total">{money(registro.total)}</strong>
        <div className="boleto__acciones">
          <Link className="btn btn--secundario btn--chico" to={`/cliente/visitas/${registro.id}`}>
            Ver QR
          </Link>
          {!pagado && registro.estado_registro === 'ACTIVO' && (
            <Link className="btn btn--primario btn--chico" to={`/cliente/visitas/${registro.id}/pagar`}>
              Pagar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
