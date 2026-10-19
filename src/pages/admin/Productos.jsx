import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { catalogoApi } from '../../api/endpoints';
import { Alerta, Boton, Campo, Encabezado, ErrorApi, Estado, Loader } from '../../components/ui';
import { cargarProductosConocidos, marcarProductoInactivo, recordarProducto } from '../../utils/catalogoAdmin';
import { TIPO_PRODUCTO_LABEL } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

const VACIO = { nombre: '', codigo: '', descripcion: '', tipo: 'BRAZALETE' };

export default function Productos() {
  const { data: productos, error, loading, reload } = useAsync(cargarProductosConocidos, []);
  const [f, setF] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function crear(e) {
    e.preventDefault();
    setErrorForm(null);
    setGuardando(true);
    try {
      const p = await catalogoApi.crearProducto({
        nombre: f.nombre.trim(),
        codigo: f.codigo.trim().toUpperCase(),
        descripcion: f.descripcion.trim() || null,
        tipo: f.tipo
      });
      recordarProducto(p);
      setMensaje(`Producto "${p.nombre}" creado con ID ${p.id}. Ahora asígnale precio en "Precios y oferta".`);
      setF(VACIO);
      setAbierto(false);
      reload();
    } catch (err) {
      setErrorForm(err);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Quedará desactivado (no se borra) para no afectar el historial.`)) return;
    setErrorAccion(null);
    try {
      await catalogoApi.eliminarProducto(p.id);
      marcarProductoInactivo(p.id);
      recordarProducto({ ...p, activo: false });
      setMensaje(`"${p.nombre}" quedó desactivado.`);
      reload();
    } catch (err) {
      setErrorAccion(err);
    }
  }

  return (
    <div className="pagina">
      <Encabezado titulo="Productos" acciones={!abierto && <Boton onClick={() => setAbierto(true)}><Plus size={18} /> Nuevo producto</Boton>}>
        El catálogo general. El precio de cada producto se define por parque en “Precios y oferta”.
      </Encabezado>

      {mensaje && <Alerta tipo="exito">{mensaje}</Alerta>}
      <ErrorApi error={errorAccion} />

      {abierto && (
        <form className="form form--tarjeta" onSubmit={crear}>
          <div className="fila-2">
            <Campo label="Nombre" htmlFor="pr-nom">
              <input id="pr-nom" required minLength={2} placeholder="Brazalete Xetulhá" value={f.nombre} onChange={set('nombre')} />
            </Campo>
            <Campo label="Código" htmlFor="pr-cod" ayuda="Único, ej. PROD_BRAZALETE_XHA">
              <input id="pr-cod" required minLength={2} value={f.codigo} onChange={set('codigo')} />
            </Campo>
          </div>
          <Campo label="Tipo" htmlFor="pr-tipo">
            <select id="pr-tipo" value={f.tipo} onChange={set('tipo')}>
              {Object.entries(TIPO_PRODUCTO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Descripción" htmlFor="pr-desc">
            <textarea id="pr-desc" rows={2} value={f.descripcion} onChange={set('descripcion')} />
          </Campo>
          <ErrorApi error={errorForm} titulo="No se creó el producto" />
          <div className="form__acciones">
            <Boton variante="fantasma" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={guardando}>Crear producto</Boton>
          </div>
        </form>
      )}

      {loading && <Loader />}
      <ErrorApi error={error} />
      {productos && (
        <div className="tabla-scroll panel panel--tabla">
          <table className="tabla">
            <thead>
              <tr><th>ID</th><th>Producto</th><th>Tipo</th><th className="num">Ofertas en línea</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className={p.activo ? '' : 'fila--inactiva'}>
                  <td className="num">{p.id}</td>
                  <td><strong>{p.nombre}</strong><br /><code>{p.codigo}</code></td>
                  <td>{TIPO_PRODUCTO_LABEL[p.tipo]}</td>
                  <td className="num">{p.parques}</td>
                  <td><Estado valor={p.activo} /></td>
                  <td className="acciones-celda">
                    {p.activo && (
                      <button className="btn-icono btn-icono--peligro" onClick={() => eliminar(p)} aria-label={`Eliminar ${p.nombre}`} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    )}
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
