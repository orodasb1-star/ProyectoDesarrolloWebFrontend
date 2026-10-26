import { Pencil, Plus, Power, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { catalogoApi } from '../../api/endpoints';
import { Alerta, Boton, Campo, Encabezado, ErrorApi, Loader } from '../../components/ui';
import { temaParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

const VACIO = { nombre: '', codigo: '', descripcion: '', max_personas_carnet: 5 };

function FormParque({ inicial, esNuevo, onGuardar, onCancelar }) {
  const [f, setF] = useState(inicial);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const payload = {
        nombre: f.nombre.trim(),
        descripcion: f.descripcion?.trim() || null,
        max_personas_carnet: Number(f.max_personas_carnet)
      };
      if (esNuevo) payload.codigo = f.codigo.trim().toUpperCase();
      await onGuardar(payload);
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form form--tarjeta" onSubmit={enviar}>
      <div className="fila-2">
        <Campo label="Nombre" htmlFor={`pq-nom-${f.id || 'n'}`}>
          <input id={`pq-nom-${f.id || 'n'}`} required minLength={2} value={f.nombre} onChange={set('nombre')} />
        </Campo>
        {esNuevo ? (
          <Campo label="Código" htmlFor="pq-cod" ayuda="Corto y único, ej. XHA">
            <input id="pq-cod" required minLength={2} maxLength={30} value={f.codigo} onChange={set('codigo')} />
          </Campo>
        ) : (
          <Campo label="Máx. personas por carnet" htmlFor={`pq-max-${f.id}`}>
            <input id={`pq-max-${f.id}`} type="number" min="0" max="20" value={f.max_personas_carnet} onChange={set('max_personas_carnet')} />
          </Campo>
        )}
      </div>
      {esNuevo && (
        <Campo label="Máx. personas que entran gratis por carnet" htmlFor="pq-max-n">
          <input id="pq-max-n" type="number" min="0" max="20" value={f.max_personas_carnet} onChange={set('max_personas_carnet')} />
        </Campo>
      )}
      <Campo label="Descripción" htmlFor={`pq-desc-${f.id || 'n'}`}>
        <textarea id={`pq-desc-${f.id || 'n'}`} rows={2} maxLength={1000} value={f.descripcion || ''} onChange={set('descripcion')} />
      </Campo>
      <ErrorApi error={error} titulo="No se guardó" />
      <div className="form__acciones">
        <Boton variante="fantasma" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={guardando}>{esNuevo ? 'Crear parque' : 'Guardar cambios'}</Boton>
      </div>
    </form>
  );
}

export default function Parques() {
  const { data, error, loading, reload } = useAsync(async () => {
    const todos = await catalogoApi.todosLosParques();
    return { activos: todos.filter((p) => p.activo), inactivos: todos.filter((p) => !p.activo) };
  }, []);
  const parques = data?.activos;
  const inactivos = data?.inactivos || [];
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);

  async function cambiarActivo(parque, activo) {
    setErrorAccion(null);
    if (!activo && !window.confirm(`¿Desactivar ${parque.nombre}? Dejará de aparecer para los clientes.`)) return;
    try {
      await catalogoApi.actualizarParque(parque.id, { activo });
      setMensaje(activo ? `${parque.nombre} está activo otra vez.` : `${parque.nombre} quedó desactivado.`);
      reload();
    } catch (err) {
      setErrorAccion(err);
    }
  }

  return (
    <div className="pagina">
      <Encabezado
        titulo="Parques"
        acciones={!creando && <Boton onClick={() => setCreando(true)}><Plus size={18} /> Nuevo parque</Boton>}
      >
        El máximo por carnet define cuántas personas del grupo entran gratis. Aplica a visitas nuevas.
      </Encabezado>

      {mensaje && <Alerta tipo="exito">{mensaje}</Alerta>}
      <ErrorApi error={errorAccion} />
      {creando && (
        <FormParque inicial={VACIO} esNuevo onCancelar={() => setCreando(false)}
          onGuardar={async (p) => { await catalogoApi.crearParque(p); setCreando(false); setMensaje(`Parque ${p.nombre} creado.`); reload(); }} />
      )}

      {loading && <Loader />}
      <ErrorApi error={error} />
      <ul className="lista-admin">
        {parques?.map((p) => {
          const t = temaParque(p);
          return (
            <li key={p.id} className="fila-admin" style={{ '--parque': t.color }}>
              {editando === p.id ? (
                <FormParque inicial={p} onCancelar={() => setEditando(null)}
                  onGuardar={async (payload) => { await catalogoApi.actualizarParque(p.id, payload); setEditando(null); setMensaje(`${payload.nombre} actualizado.`); reload(); }} />
              ) : (
                <>
                  <span className="fila-admin__color" />
                  <div className="fila-admin__info">
                    <strong>{p.nombre} <code>{p.codigo}</code></strong>
                    <span className="texto-suave">{p.descripcion || 'Sin descripción'}</span>
                  </div>
                  <div className="fila-admin__dato">
                    <strong>{p.max_personas_carnet}</strong>
                    <small>gratis por carnet</small>
                  </div>
                  <div className="fila-admin__acciones">
                    <button className="btn-icono" onClick={() => setEditando(p.id)} aria-label={`Editar ${p.nombre}`} title="Editar"><Pencil size={18} /></button>
                    <button className="btn-icono btn-icono--peligro" onClick={() => cambiarActivo(p, false)} aria-label={`Desactivar ${p.nombre}`} title="Desactivar"><Power size={18} /></button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {inactivos.length > 0 && (
        <>
          <h2 className="subtitulo">Parques desactivados</h2>
          <ul className="lista-admin">
            {inactivos.map((p) => (
              <li key={p.id} className="fila-admin fila-admin--inactiva">
                <div className="fila-admin__info"><strong>{p.nombre} <code>{p.codigo}</code></strong>{p.descripcion && <span className="texto-suave">{p.descripcion}</span>}</div>
                <div className="fila-admin__acciones">
                  <Boton variante="secundario" className="btn--chico" onClick={() => cambiarActivo(p, true)}><RotateCcw size={16} /> Reactivar</Boton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
