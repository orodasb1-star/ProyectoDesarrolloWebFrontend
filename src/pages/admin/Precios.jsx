import { Ban, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { catalogoApi } from '../../api/endpoints';
import { Alerta, Boton, Campo, Encabezado, ErrorApi, Loader } from '../../components/ui';
import { cargarProductosConocidos } from '../../utils/catalogoAdmin';
import { CATEGORIA_LABEL, TIPO_PRODUCTO_LABEL, fechaLarga, hoyGuatemala, money, soloFecha } from '../../utils/format';
import { temaParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

function FormOferta({ parqueId, productos, inicial, onListo, onCancelar }) {
  const esNueva = !inicial;
  const [f, setF] = useState(() =>
    inicial
      ? {
          producto_id: inicial.producto_id,
          categoria_edad: inicial.categoria_edad,
          precio: inicial.precio,
          disponible_online: inicial.disponible_online,
          fecha_inicio: soloFecha(inicial.fecha_inicio),
          fecha_fin: soloFecha(inicial.fecha_fin)
        }
      : { producto_id: '', categoria_edad: 'UNICA', precio: '', disponible_online: true, fecha_inicio: '', fecha_fin: '' }
  );
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const producto = productos.find((p) => p.id === Number(f.producto_id)) || (inicial && { tipo: inicial.tipo, nombre: inicial.nombre });
  const esEntrada = producto?.tipo === 'ENTRADA';

  useEffect(() => {
    if (!esNueva || !producto) return;
    setF((p) => ({ ...p, categoria_edad: producto.tipo === 'ENTRADA' ? (p.categoria_edad === 'UNICA' ? 'ADULTO' : p.categoria_edad) : 'UNICA' }));
  }, [producto?.tipo, esNueva]); // eslint-disable-line react-hooks/exhaustive-deps

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    if (f.fecha_inicio && f.fecha_fin && f.fecha_fin < f.fecha_inicio) {
      setError({ message: 'La fecha de fin no puede ser anterior a la de inicio.', detalles: [] });
      return;
    }
    setGuardando(true);
    try {
      await catalogoApi.guardarOferta({
        parque_id: parqueId,
        producto_id: Number(f.producto_id),
        categoria_edad: f.categoria_edad,
        precio: Number(f.precio),
        moneda: 'GTQ',
        disponible_online: f.disponible_online,
        fecha_inicio: f.fecha_inicio || null,
        fecha_fin: f.fecha_fin || null
      });
      onListo(esNueva ? 'Oferta agregada.' : 'Precio actualizado. Las visitas ya creadas conservan su precio.');
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form form--tarjeta" onSubmit={enviar}>
      {esNueva ? (
        <div className="fila-2">
          <Campo label="Producto" htmlFor="of-prod">
            <select id="of-prod" required value={f.producto_id} onChange={(e) => setF((p) => ({ ...p, producto_id: e.target.value }))}>
              <option value="">Elige un producto</option>
              {productos.filter((p) => p.activo).map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({TIPO_PRODUCTO_LABEL[p.tipo]})</option>
              ))}
            </select>
          </Campo>
          <Campo label="Categoría de edad" htmlFor="of-cat" ayuda={esEntrada ? 'Las entradas tienen precio por edad.' : 'Este tipo usa precio único.'}>
            <select id="of-cat" value={f.categoria_edad} disabled={!esEntrada}
              onChange={(e) => setF((p) => ({ ...p, categoria_edad: e.target.value }))}>
              {(esEntrada ? ['NINO', 'ADULTO', 'ADULTO_MAYOR'] : ['UNICA']).map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
            </select>
          </Campo>
        </div>
      ) : (
        <p className="form__titulo"><strong>{inicial.nombre}</strong> {CATEGORIA_LABEL[inicial.categoria_edad]}</p>
      )}
      <div className="fila-3">
        <Campo label="Precio (Q)" htmlFor={`of-precio-${inicial?.parque_producto_id || 'n'}`}>
          <input id={`of-precio-${inicial?.parque_producto_id || 'n'}`} type="number" required min="0" step="0.01" inputMode="decimal"
            value={f.precio} onChange={(e) => setF((p) => ({ ...p, precio: e.target.value }))} />
        </Campo>
        <Campo label="Inicio de promoción" htmlFor={`of-ini-${inicial?.parque_producto_id || 'n'}`} ayuda="Vacío = sin límite">
          <input id={`of-ini-${inicial?.parque_producto_id || 'n'}`} type="date" value={f.fecha_inicio}
            onChange={(e) => setF((p) => ({ ...p, fecha_inicio: e.target.value }))} />
        </Campo>
        <Campo label="Fin de promoción" htmlFor={`of-fin-${inicial?.parque_producto_id || 'n'}`} ayuda="Vacío = sin límite">
          <input id={`of-fin-${inicial?.parque_producto_id || 'n'}`} type="date" value={f.fecha_fin} min={f.fecha_inicio || undefined}
            onChange={(e) => setF((p) => ({ ...p, fecha_fin: e.target.value }))} />
        </Campo>
      </div>
      <label className="interruptor">
        <input type="checkbox" checked={f.disponible_online} onChange={(e) => setF((p) => ({ ...p, disponible_online: e.target.checked }))} />
        <span>Disponible para venta en línea</span>
      </label>
      <ErrorApi error={error} titulo="No se guardó" />
      <div className="form__acciones">
        <Boton variante="fantasma" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={guardando}>{esNueva ? 'Agregar oferta' : 'Guardar precio'}</Boton>
      </div>
    </form>
  );
}

export default function Precios() {
  const parques = useAsync(() => catalogoApi.parques(), []);
  const productos = useAsync(cargarProductosConocidos, []);
  const [parqueId, setParqueId] = useState(null);
  const [fecha, setFecha] = useState(hoyGuatemala());
  const [editando, setEditando] = useState(null);
  const [nueva, setNueva] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);

  useEffect(() => {
    if (!parqueId && parques.data?.length) setParqueId(parques.data[0].id);
  }, [parques.data, parqueId]);

  const ofertas = useAsync(() => (parqueId ? catalogoApi.productosDeParque(parqueId, fecha) : Promise.resolve([])), [parqueId, fecha]);
  const parque = parques.data?.find((p) => p.id === parqueId);

  function listo(msg) {
    setMensaje(msg);
    setEditando(null);
    setNueva(false);
    ofertas.reload();
  }

  async function retirar(o) {
    if (!window.confirm(`¿Quitar "${o.nombre}" (${CATEGORIA_LABEL[o.categoria_edad]}) de la venta en línea de ${parque?.nombre}?`)) return;
    setErrorAccion(null);
    try {
      await catalogoApi.retirarOferta(o.parque_producto_id);
      listo(`"${o.nombre}" ya no se vende en línea en ${parque?.nombre}. Para volver a ofrecerlo, agrégalo de nuevo.`);
    } catch (err) {
      setErrorAccion(err);
    }
  }

  return (
    <div className="pagina">
      <Encabezado titulo="Precios y oferta por parque"
        acciones={parqueId && !nueva && <Boton onClick={() => setNueva(true)}><Plus size={18} /> Agregar oferta</Boton>}>
        Si cambias un precio, las visitas nuevas usan el precio nuevo y las ya creadas conservan el suyo.
      </Encabezado>

      {parques.loading && <Loader />}
      <div className="selector-chips" role="tablist">
        {parques.data?.map((p) => {
          const t = temaParque(p);
          return (
            <button key={p.id} role="tab" aria-selected={p.id === parqueId} className={`chip ${p.id === parqueId ? 'chip--sel' : ''}`}
              style={{ '--parque': t.color, '--parque-suave': t.suave }} onClick={() => { setParqueId(p.id); setEditando(null); setNueva(false); }}>
              {p.nombre}
            </button>
          );
        })}
        <label className="filtros__fecha">
          Vigentes al
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value || hoyGuatemala())} />
        </label>
      </div>

      {mensaje && <Alerta tipo="exito">{mensaje}</Alerta>}
      <ErrorApi error={errorAccion} />

      {nueva && parqueId && (
        <FormOferta parqueId={parqueId} productos={productos.data || []} onListo={listo} onCancelar={() => setNueva(false)} />
      )}

      {ofertas.loading && <Loader />}
      <ErrorApi error={ofertas.error} />
      {ofertas.data && (
        <div className="panel panel--tabla">
          <p className="texto-suave panel__nota">
            Ofertas en línea de {parque?.nombre} vigentes el {fechaLarga(fecha)}. Las retiradas o fuera de fecha no aparecen aquí.
          </p>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Producto</th><th>Categoría</th><th className="num">Precio</th><th>Vigencia</th><th /></tr>
              </thead>
              <tbody>
                {ofertas.data.length === 0 && (
                  <tr><td colSpan={5} className="texto-suave">Este parque no tiene ofertas vigentes en esa fecha.</td></tr>
                )}
                {ofertas.data.map((o) =>
                  editando === o.parque_producto_id ? (
                    <tr key={o.parque_producto_id}>
                      <td colSpan={5}>
                        <FormOferta parqueId={parqueId} productos={productos.data || []} inicial={o} onListo={listo} onCancelar={() => setEditando(null)} />
                      </td>
                    </tr>
                  ) : (
                    <tr key={o.parque_producto_id}>
                      <td><strong>{o.nombre}</strong><br /><small className="texto-suave">{TIPO_PRODUCTO_LABEL[o.tipo]}</small></td>
                      <td>{CATEGORIA_LABEL[o.categoria_edad]}</td>
                      <td className="num"><strong>{money(o.precio)}</strong></td>
                      <td>
                        {o.fecha_inicio || o.fecha_fin
                          ? `${o.fecha_inicio ? fechaLarga(o.fecha_inicio, true) : 'Siempre'} a ${o.fecha_fin ? fechaLarga(o.fecha_fin, true) : 'sin fin'}`
                          : 'Permanente'}
                      </td>
                      <td className="acciones-celda">
                        <button className="btn-icono" onClick={() => setEditando(o.parque_producto_id)} aria-label={`Editar ${o.nombre}`} title="Editar precio"><Pencil size={18} /></button>
                        <button className="btn-icono btn-icono--peligro" onClick={() => retirar(o)} aria-label={`Quitar ${o.nombre} de la venta`} title="Quitar de la venta en línea"><Ban size={18} /></button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
