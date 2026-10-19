import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../../api/endpoints';
import { Alerta, AvisoEndpoint, Boton, Campo, Encabezado, ErrorApi, Estado, Loader } from '../../components/ui';
import { fechaHora } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

const VACIO = { nombres: '', apellidos: '', edad: '', email: '', password: '', telefono: '' };

function FormEmpleado({ onCreado, onCancelar }) {
  const [f, setF] = useState(VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const emp = await authApi.crearEmpleado({
        nombres: f.nombres.trim(),
        apellidos: f.apellidos.trim(),
        edad: f.edad ? Number(f.edad) : undefined,
        email: f.email.trim(),
        password: f.password,
        telefono: f.telefono.trim() || null
      });
      onCreado(emp);
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form form--tarjeta" onSubmit={enviar}>
      <h2 className="panel__titulo">Nueva cuenta de taquilla</h2>
      <div className="fila-2">
        <Campo label="Nombres" htmlFor="em-nom"><input id="em-nom" required minLength={2} value={f.nombres} onChange={set('nombres')} /></Campo>
        <Campo label="Apellidos" htmlFor="em-ape"><input id="em-ape" required minLength={2} value={f.apellidos} onChange={set('apellidos')} /></Campo>
      </div>
      <div className="fila-2">
        <Campo label="Correo" htmlFor="em-email"><input id="em-email" type="email" required value={f.email} onChange={set('email')} /></Campo>
        <Campo label="Contraseña temporal" htmlFor="em-pass" ayuda="8+ caracteres, con mayúscula, minúscula y número.">
          <input id="em-pass" type="text" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} />
        </Campo>
      </div>
      <div className="fila-2">
        <Campo label="Edad" htmlFor="em-edad" ayuda="Opcional, mínimo 18."><input id="em-edad" type="number" min="18" max="100" value={f.edad} onChange={set('edad')} /></Campo>
        <Campo label="Teléfono" htmlFor="em-tel" ayuda="Opcional"><input id="em-tel" type="tel" value={f.telefono} onChange={set('telefono')} /></Campo>
      </div>
      <ErrorApi error={error} titulo="No se creó la cuenta" />
      <div className="form__acciones">
        <Boton variante="fantasma" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={guardando}>Crear empleado</Boton>
      </div>
    </form>
  );
}

export default function Usuarios() {
  const [rol, setRol] = useState('EMPLEADO');
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);
  const lista = useAsync(() => authApi.listarUsuarios(rol), [rol]);

  async function cambiar(u) {
    const accion = u.activo ? 'Desactivar' : 'Activar';
    if (!window.confirm(`¿${accion} la cuenta de ${u.nombres} ${u.apellidos}?`)) return;
    setErrorAccion(null);
    try {
      await authApi.cambiarEstadoUsuario(u.id, !u.activo);
      setMensaje(`Cuenta de ${u.nombres} ${u.activo ? 'desactivada' : 'activada'}.`);
      lista.reload();
    } catch (err) {
      setErrorAccion(err);
    }
  }

  return (
    <div className="pagina">
      <Encabezado titulo="Usuarios"
        acciones={!creando && <Boton onClick={() => setCreando(true)}><UserPlus size={18} /> Nuevo empleado</Boton>}>
        Crea cuentas de taquilla y desactiva las de quienes ya no trabajan o de clientes que lo pidan.
      </Encabezado>

      {mensaje && <Alerta tipo="exito">{mensaje}</Alerta>}
      {creando && (
        <FormEmpleado onCancelar={() => setCreando(false)}
          onCreado={(e) => { setCreando(false); setMensaje(`Cuenta creada para ${e.nombres} (${e.email}). Ya puede entrar a Taquilla.`); lista.reload(); }} />
      )}

      <div className="pestanas" role="tablist">
        {[['EMPLEADO', 'Empleados'], ['CLIENTE', 'Clientes']].map(([k, t]) => (
          <button key={k} role="tab" aria-selected={rol === k} className={rol === k ? 'activa' : ''} onClick={() => setRol(k)}>{t}</button>
        ))}
      </div>

      <ErrorApi error={errorAccion} />
      {lista.loading && <Loader />}
      {lista.error?.status === 404 ? (
        <AvisoEndpoint ruta="GET /api/auth/admin/usuarios?rol=… y PATCH /api/auth/admin/usuarios/:id"
          descripcion="El backend permite crear empleados, pero todavía no listar usuarios ni desactivarlos." />
      ) : (
        <ErrorApi error={lista.error} />
      )}
      {Array.isArray(lista.data) && (
        <div className="panel panel--tabla tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th>{rol === 'CLIENTE' && <th>Carnet</th>}<th>Alta</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {lista.data.map((u) => (
                <tr key={u.id} className={u.activo ? '' : 'fila--inactiva'}>
                  <td><strong>{u.nombres} {u.apellidos}</strong></td>
                  <td>{u.email}</td>
                  {rol === 'CLIENTE' && <td>{u.carnet || '—'}</td>}
                  <td>{fechaHora(u.created_at)}</td>
                  <td><Estado valor={u.activo} /></td>
                  <td className="acciones-celda">
                    <Boton variante={u.activo ? 'peligro' : 'secundario'} className="btn--chico" onClick={() => cambiar(u)}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
