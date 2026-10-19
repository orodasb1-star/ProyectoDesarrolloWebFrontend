import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { Boton, Campo, ErrorApi } from '../../components/ui';
import { AuthLayout } from './AuthLayout';

const INICIAL = { nombres: '', apellidos: '', edad: '', email: '', password: '', confirmar: '', telefono: '', carnet: '' };

function validar(f) {
  const e = {};
  if (f.nombres.trim().length < 2) e.nombres = 'Escribe al menos 2 letras.';
  if (f.apellidos.trim().length < 2) e.apellidos = 'Escribe al menos 2 letras.';
  if (f.edad === '' || Number(f.edad) < 0 || Number(f.edad) > 120) e.edad = 'Ingresa tu edad (0 a 120).';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Correo no válido.';
  if (f.password.length < 8) e.password = 'Mínimo 8 caracteres.';
  else if (!/[A-Z]/.test(f.password) || !/[a-z]/.test(f.password) || !/[0-9]/.test(f.password))
    e.password = 'Incluye mayúscula, minúscula y número.';
  if (f.confirmar !== f.password) e.confirmar = 'Las contraseñas no coinciden.';
  return e;
}

export default function Registro() {
  const navigate = useNavigate();
  const [f, setF] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrores((p) => ({ ...p, [k]: undefined }));
  };

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(f);
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setError(null);
    setEnviando(true);
    try {
      await authApi.register({
        nombres: f.nombres.trim(),
        apellidos: f.apellidos.trim(),
        edad: Number(f.edad),
        email: f.email.trim(),
        password: f.password,
        telefono: f.telefono.trim() || null,
        // Vacío = el sistema entiende que no tiene carnet
        carnet: f.carnet.trim() || null
      });
      navigate('/login', { replace: true, state: { registrado: true } });
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Crea tu cuenta">
      <form onSubmit={enviar} className="form" noValidate>
        <div className="fila-2">
          <Campo label="Nombres" error={errores.nombres} htmlFor="r-nom">
            <input id="r-nom" autoComplete="given-name" value={f.nombres} onChange={set('nombres')} />
          </Campo>
          <Campo label="Apellidos" error={errores.apellidos} htmlFor="r-ape">
            <input id="r-ape" autoComplete="family-name" value={f.apellidos} onChange={set('apellidos')} />
          </Campo>
        </div>
        <div className="fila-2">
          <Campo label="Edad" error={errores.edad} htmlFor="r-edad" ayuda="Define tu tarifa de entrada.">
            <input id="r-edad" type="number" min="0" max="120" inputMode="numeric" value={f.edad} onChange={set('edad')} />
          </Campo>
          <Campo label="Teléfono" htmlFor="r-tel" ayuda="Opcional">
            <input id="r-tel" type="tel" autoComplete="tel" value={f.telefono} onChange={set('telefono')} />
          </Campo>
        </div>
        <Campo label="Correo electrónico" error={errores.email} htmlFor="r-email">
          <input id="r-email" type="email" autoComplete="email" value={f.email} onChange={set('email')} />
        </Campo>
        <div className="fila-2">
          <Campo label="Contraseña" error={errores.password} htmlFor="r-pass">
            <input id="r-pass" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
          </Campo>
          <Campo label="Repite la contraseña" error={errores.confirmar} htmlFor="r-pass2">
            <input id="r-pass2" type="password" autoComplete="new-password" value={f.confirmar} onChange={set('confirmar')} />
          </Campo>
        </div>
        <Campo label="Carnet de afiliado IRTRA" htmlFor="r-carnet"
          ayuda="Opcional. Si lo tienes, las primeras personas de tu grupo entran gratis.">
          <input id="r-carnet" placeholder="AF-000000" value={f.carnet} onChange={set('carnet')} />
        </Campo>
        <ErrorApi error={error} titulo="No se pudo crear la cuenta" />
        <Boton type="submit" cargando={enviando} className="btn--bloque btn--grande">Crear cuenta</Boton>
      </form>
      <p className="auth__alterno">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}
