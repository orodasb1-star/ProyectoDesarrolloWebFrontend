import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { temaParque } from '../utils/parques';

/** Franja tejida inspirada en las fajas típicas guatemaltecas. Sello visual de la app. */
export function Faja({ alto = 14, className = '' }) {
  return <div className={`faja ${className}`} style={{ height: alto }} aria-hidden="true" />;
}

export function Logo({ claro = false }) {
  return (
    <span className={`logo ${claro ? 'logo--claro' : ''}`}>
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill={claro ? '#FFFFFF' : '#0B4F5C'} />
        <path d="M5 26c4-4 8-4 12 0s8 4 12 0 6-3 6-3v10H5z" fill="#1B6FA8" />
        <path d="M20 6l9 15H11z" fill="#F2B705" />
        <circle cx="30" cy="11" r="3.4" fill="#E0663A" />
      </svg>
      <span className="logo__texto">
        IRTRA <span>en línea</span>
      </span>
    </span>
  );
}

export function Loader({ texto = 'Cargando…', pantalla = false }) {
  return (
    <div className={`loader ${pantalla ? 'loader--pantalla' : ''}`} role="status">
      <Loader2 className="spin" size={22} />
      <span>{texto}</span>
    </div>
  );
}

const ALERT_ICON = { info: Info, exito: CheckCircle2, aviso: AlertTriangle, error: XCircle };

export function Alerta({ tipo = 'info', titulo, children, accion }) {
  const Icon = ALERT_ICON[tipo] || Info;
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icon size={20} className="alerta__icono" />
      <div className="alerta__cuerpo">
        {titulo && <strong>{titulo}</strong>}
        {children && <div>{children}</div>}
      </div>
      {accion}
    </div>
  );
}

/** Muestra un ApiError con sus detalles de validación. */
export function ErrorApi({ error, titulo }) {
  if (!error) return null;
  const detalles = error.detalles || [];
  return (
    <Alerta tipo="error" titulo={titulo || error.message}>
      {titulo && <p>{error.message}</p>}
      {detalles.length > 0 && (
        <ul className="alerta__lista">
          {detalles.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </Alerta>
  );
}

/** Aviso para funciones cuya ruta aún no existe en el backend (404). */
export function AvisoEndpoint({ ruta, descripcion }) {
  return (
    <Alerta tipo="aviso" titulo="Esta sección necesita un endpoint que el backend todavía no tiene">
      <p>
        {descripcion} La pantalla ya está lista y consumirá <code>{ruta}</code> en cuanto exista. Detalles en{' '}
        <code>ENDPOINTS_FALTANTES.md</code>.
      </p>
    </Alerta>
  );
}

const ESTADOS = {
  PENDIENTE: { txt: 'Pendiente', cls: 'aviso' },
  PAGADO: { txt: 'Pagado', cls: 'exito' },
  ENTREGADO: { txt: 'Entregado', cls: 'info' },
  ACTIVO: { txt: 'Activo', cls: 'exito' },
  CERRADO: { txt: 'Cerrado', cls: 'neutro' },
  NO_DISPONIBLE: { txt: 'No disponible', cls: 'neutro' },
  DISPONIBLE: { txt: 'Disponible', cls: 'exito' },
  EXPIRADO: { txt: 'Expirado', cls: 'error' },
  APROBADO: { txt: 'Aprobado', cls: 'exito' },
  RECHAZADO: { txt: 'Rechazado', cls: 'error' },
  ENVIADO: { txt: 'Enviado', cls: 'exito' },
  FALLIDO: { txt: 'Fallido', cls: 'error' },
  true: { txt: 'Activo', cls: 'exito' },
  false: { txt: 'Inactivo', cls: 'neutro' }
};

export function Estado({ valor, texto }) {
  const e = ESTADOS[String(valor)] || { txt: valor, cls: 'neutro' };
  return <span className={`estado estado--${e.cls}`}>{texto || e.txt}</span>;
}

export function Vacio({ icono: Icon, titulo, children, accion }) {
  return (
    <div className="vacio">
      {Icon && <Icon size={40} strokeWidth={1.5} />}
      <h3>{titulo}</h3>
      {children && <p>{children}</p>}
      {accion}
    </div>
  );
}

export function Encabezado({ titulo, children, volver, acciones }) {
  return (
    <header className="encabezado">
      {volver && (
        <Link to={volver.to} className="encabezado__volver">
          ← {volver.texto}
        </Link>
      )}
      <div className="encabezado__fila">
        <div>
          <h1>{titulo}</h1>
          {children && <p className="encabezado__sub">{children}</p>}
        </div>
        {acciones && <div className="encabezado__acciones">{acciones}</div>}
      </div>
    </header>
  );
}

export function MarcaParque({ parque, nombre, tamano = 'md' }) {
  const tema = temaParque(parque || { nombre });
  const texto = nombre || parque?.nombre || parque?.parque_nombre || '';
  return (
    <span className={`marca-parque marca-parque--${tamano}`} style={{ '--parque': tema.color, '--parque-suave': tema.suave }}>
      <span className="marca-parque__punto" />
      {texto}
    </span>
  );
}

export function Campo({ label, error, ayuda, children, htmlFor }) {
  return (
    <div className={`campo ${error ? 'campo--error' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="campo__error">{error}</span> : ayuda ? <span className="campo__ayuda">{ayuda}</span> : null}
    </div>
  );
}

export function Boton({ cargando, children, variante = 'primario', className = '', disabled, type = 'button', ...props }) {
  return (
    <button type={type} className={`btn btn--${variante} ${className}`} disabled={cargando || disabled} {...props}>
      {cargando && <Loader2 size={18} className="spin" />}
      {children}
    </button>
  );
}
