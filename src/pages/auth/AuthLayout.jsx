import { Faja, Logo } from '../../components/ui';
import { temaParque } from '../../utils/parques';

const PARQUES = [
  { codigo: 'XOC', nombre: 'Xocomil' },
  { codigo: 'XET', nombre: 'Xetulul' },
  { codigo: 'XEJ', nombre: 'Xejuyup' },
  { codigo: 'XHA', nombre: 'Xetulhá' }
];

export function AuthLayout({ titulo, children }) {
  return (
    <div className="auth">
      <section className="auth__lado">
        <Logo claro />
        <div className="auth__mensaje">
          <h1>Llega directo a la diversión.</h1>
          <p>Compra tus entradas, parqueo y brazaletes antes de salir de casa. En taquilla solo muestras tu código QR.</p>
        </div>
        <ul className="auth__parques" aria-label="Parques">
          {PARQUES.map((p) => {
            const t = temaParque(p);
            return (
              <li key={p.codigo} style={{ '--parque': t.color }}>
                <strong>{p.nombre}</strong>
                <span>{t.lema}</span>
              </li>
            );
          })}
        </ul>
        <Faja alto={14} className="auth__faja" />
      </section>
      <section className="auth__form">
        <div className="auth__caja">
          <h2>{titulo}</h2>
          {children}
        </div>
      </section>
    </div>
  );
}
