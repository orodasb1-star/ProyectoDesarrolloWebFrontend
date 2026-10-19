import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alerta, Boton, Campo, ErrorApi } from '../../components/ui';
import { HOME_POR_ROL, useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

const CUENTAS_PRUEBA = [
  { rol: 'Cliente con carnet', email: 'afiliado@gmail.com' },
  { rol: 'Cliente sin carnet', email: 'particular@gmail.com' },
  { rol: 'Taquilla', email: 'taquilla@irtra.org.gt' },
  { rol: 'Administrador', email: 'admin@irtra.org.gt' }
];

export default function Login() {
  const { login, autenticado, rol } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado && rol) return <Navigate to={HOME_POR_ROL[rol]} replace />;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const rolUsuario = await login(email.trim(), password);
      const home = HOME_POR_ROL[rolUsuario] || '/login';
      const desde = location.state?.desde;
      navigate(desde && desde.startsWith(home) ? desde : home, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Inicia sesión">
      {location.state?.registrado && (
        <Alerta tipo="exito" titulo="Tu cuenta está lista">Ingresa con tu correo y contraseña.</Alerta>
      )}
      <form onSubmit={enviar} className="form">
        <Campo label="Correo electrónico" htmlFor="email">
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo label="Contraseña" htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </Campo>
        <ErrorApi error={error} />
        <Boton type="submit" cargando={enviando} className="btn--bloque btn--grande">Entrar</Boton>
      </form>
      <p className="auth__alterno">
        ¿Primera vez? <Link to="/registro">Crea tu cuenta de cliente</Link>
      </p>

      <details className="cuentas-prueba">
        <summary>Cuentas de prueba del seed</summary>
        <p>Contraseña de todas: <code>Password123!</code></p>
        <ul>
          {CUENTAS_PRUEBA.map((c) => (
            <li key={c.email}>
              <button type="button" className="enlace" onClick={() => { setEmail(c.email); setPassword('Password123!'); }}>
                {c.rol}
              </button>
              <span>{c.email}</span>
            </li>
          ))}
        </ul>
      </details>
    </AuthLayout>
  );
}
