import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { catalogoApi, reportesApi } from '../../api/endpoints';
import { aFilas, TablaGenerica } from '../../components/TablaGenerica';
import { AvisoEndpoint, Encabezado, ErrorApi, Estado, Loader } from '../../components/ui';
import { fechaLarga, money, plural } from '../../utils/format';
import { colorParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

// Colores por tipo de venta (paleta validada; el amarillo siempre va con etiqueta y tabla).
const TIPOS = [
  { key: 'total_entradas', nombre: 'Entradas', color: '#0A8FA3' },
  { key: 'total_parqueo', nombre: 'Parqueo', color: '#D99A00' },
  { key: 'total_pedidos', nombre: 'Pedidos', color: '#7A4FB5' }
];

const EXTRA = [
  { slug: 'validaciones-rechazadas', titulo: 'Validaciones rechazadas', desc: 'Intentos fallidos y su motivo.' },
  { slug: 'visitas', titulo: 'Visitas', desc: 'Registros por estado, nunca pagados, con o sin vehículo y carnet.' },
  { slug: 'visitantes', titulo: 'Visitantes', desc: 'Niños, adultos y adultos mayores por parque.' },
  { slug: 'productos-mas-vendidos', titulo: 'Productos más vendidos', desc: 'Brazaletes y tickets con más ventas.' },
  { slug: 'salud', titulo: 'Salud de la app', desc: 'Pagos rechazados, QR expirados sin usar y tiempo entre pago y entrega.' },
  { slug: 'usuarios', titulo: 'Usuarios nuevos', desc: 'Registros nuevos por día y cuántos tienen carnet.' }
];

const n = (v) => Number(v) || 0;
const qCorto = (v) => (v >= 1000 ? `Q${(v / 1000).toLocaleString('es-GT', { maximumFractionDigits: 1 })}k` : `Q${v}`);

function TooltipVentas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + n(p.value), 0);
  return (
    <div className="tooltip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} className="tooltip__fila">
          <span className="tooltip__marca" style={{ background: p.color }} />
          {p.name}
          <span>{money(p.value)}</span>
        </div>
      ))}
      <div className="tooltip__fila tooltip__total">Total<span>{money(total)}</span></div>
    </div>
  );
}

function TooltipSimple({ active, payload, label, formato = (v) => v, sufijo = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <strong>{label}</strong>
      <div className="tooltip__fila">{formato(payload[0].value)}{sufijo}</div>
      {payload[0].payload.extra && <div className="tooltip__fila texto-suave">{payload[0].payload.extra}</div>}
    </div>
  );
}

function Leyenda({ items }) {
  return (
    <ul className="leyenda">
      {items.map((i) => (
        <li key={i.nombre}>
          <span className="leyenda__marca" style={{ background: i.color }} />
          {i.nombre}
        </li>
      ))}
    </ul>
  );
}

export default function Reportes() {
  const [filtros, setFiltros] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [parqueSel, setParqueSel] = useState('');
  const [verTabla, setVerTabla] = useState(false);
  const [extra, setExtra] = useState(EXTRA[0].slug);

  const parques = useAsync(() => catalogoApi.parques(), []);
  const base = useAsync(() => Promise.all([reportesApi.resumen(), reportesApi.calificaciones()]), []);
  const filtrado = useAsync(
    () => Promise.all([reportesApi.ventas(filtros), reportesApi.validacionesPorEmpleado(filtros)]),
    [filtros.fecha_inicio, filtros.fecha_fin]
  );
  const reporteExtra = useAsync(() => reportesApi.extra(extra, filtros), [extra, filtros.fecha_inicio, filtros.fecha_fin]);

  const [resumen, calif] = base.data || [];
  const [ventas, validaciones] = filtrado.data || [];

  const filas = useMemo(
    () => (ventas?.ventas_por_parque_dia || []).filter((v) => !parqueSel || String(v.parque_id) === parqueSel),
    [ventas, parqueSel]
  );

  // Agregaciones solo para presentar el reporte (los montos base vienen del backend).
  const porDia = useMemo(() => {
    const m = new Map();
    filas.forEach((v) => {
      const d = m.get(v.fecha) || { fecha: v.fecha, total_entradas: 0, total_parqueo: 0, total_pedidos: 0 };
      TIPOS.forEach((t) => (d[t.key] += n(v[t.key])));
      m.set(v.fecha, d);
    });
    return [...m.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((d) => ({ ...d, etiqueta: fechaLarga(d.fecha, true) }));
  }, [filas]);

  const porParque = useMemo(() => {
    const m = new Map();
    filas.forEach((v) => m.set(v.parque_nombre, (m.get(v.parque_nombre) || 0) + n(v.total_ventas)));
    return [...m.entries()].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
  }, [filas]);

  const totalRango = porParque.reduce((s, p) => s + p.total, 0);
  const qrEntregados = resumen?.codigos_qr_por_estado?.find((q) => q.estado === 'ENTREGADO')?.total || 0;
  const qrExpirados = resumen?.codigos_qr_por_estado?.find((q) => q.estado === 'EXPIRADO')?.total || 0;
  const califParques = (calif?.por_parque || []).map((p) => ({
    nombre: p.parque_nombre,
    promedio: p.promedio_puntuacion,
    extra: `${p.total_calificaciones} calificaciones`
  }));
  const maxEstrellas = Math.max(1, ...(calif?.distribucion_estrellas || []).map((d) => d.total));
  const maxValid = Math.max(1, ...(validaciones?.empleados || []).map((e) => e.total_validados + e.total_rechazados));

  return (
    <div className="pagina pagina--ancha">
      <Encabezado titulo="Reportes">Las fechas filtran ventas y validaciones. El parque filtra ventas.</Encabezado>

      <div className="filtros">
        <label>
          Desde
          <input type="date" value={filtros.fecha_inicio} onChange={(e) => setFiltros((f) => ({ ...f, fecha_inicio: e.target.value }))} />
        </label>
        <label>
          Hasta
          <input type="date" value={filtros.fecha_fin} min={filtros.fecha_inicio || undefined}
            onChange={(e) => setFiltros((f) => ({ ...f, fecha_fin: e.target.value }))} />
        </label>
        <label>
          Parque
          <select value={parqueSel} onChange={(e) => setParqueSel(e.target.value)}>
            <option value="">Todos</option>
            {parques.data?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </label>
        {(filtros.fecha_inicio || filtros.fecha_fin || parqueSel) && (
          <button className="enlace" onClick={() => { setFiltros({ fecha_inicio: '', fecha_fin: '' }); setParqueSel(''); }}>
            Quitar filtros
          </button>
        )}
      </div>

      {base.loading && <Loader texto="Calculando reportes…" />}
      <ErrorApi error={base.error} />

      {resumen && (
        <div className="kpis">
          <div className="kpi kpi--principal">
            <span>Recaudación total</span>
            <strong>{money(resumen.recaudacion_total_gtq)}</strong>
            <small>Pagos aprobados desde el inicio</small>
          </div>
          <div className="kpi">
            <span>Ventas en el filtro</span>
            <strong>{filtrado.loading ? '…' : money(totalRango)}</strong>
            <small>{parqueSel ? parques.data?.find((p) => String(p.id) === parqueSel)?.nombre : 'Todos los parques'}</small>
          </div>
          <div className="kpi">
            <span>Calificación promedio</span>
            <strong>{resumen.calificacion_general.promedio.toFixed(2)} <em>/ 5</em></strong>
            <small>{plural(resumen.calificacion_general.total_evaluaciones, "calificación", "calificaciones")}</small>
          </div>
          <div className="kpi">
            <span>QR entregados</span>
            <strong>{qrEntregados}</strong>
            <small>{qrExpirados} expiraron sin usarse</small>
          </div>
        </div>
      )}

      <ErrorApi error={filtrado.error} />
      <div className="graficas">
        <section className="panel grafica grafica--ancha">
          <div className="grafica__cabeza">
            <h2>Ventas por día</h2>
            <button className="enlace" onClick={() => setVerTabla((v) => !v)}>{verTabla ? 'Ver gráfica' : 'Ver tabla'}</button>
          </div>
          <Leyenda items={TIPOS} />
          {porDia.length === 0 && !filtrado.loading ? (
            <p className="texto-suave">No hay ventas aprobadas en este rango.</p>
          ) : verTabla ? (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead><tr><th>Fecha</th><th>Parque</th><th>Entradas</th><th>Parqueo</th><th>Pedidos</th><th>Total</th></tr></thead>
                <tbody>
                  {filas.map((v, i) => (
                    <tr key={i}>
                      <td>{fechaLarga(v.fecha, true)}</td><td>{v.parque_nombre}</td>
                      <td className="num">{money(v.total_entradas)}</td><td className="num">{money(v.total_parqueo)}</td>
                      <td className="num">{money(v.total_pedidos)}</td><td className="num"><strong>{money(v.total_ventas)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porDia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="#E3ECEA" />
                <XAxis dataKey="etiqueta" tickLine={false} axisLine={{ stroke: '#C9D8D5' }} tick={{ fill: '#55717A', fontSize: 12 }} />
                <YAxis tickFormatter={qCorto} tickLine={false} axisLine={false} tick={{ fill: '#55717A', fontSize: 12 }} width={56} />
                <Tooltip content={<TooltipVentas />} cursor={{ fill: 'rgba(11,79,92,0.06)' }} />
                {TIPOS.map((t, i) => (
                  <Bar key={t.key} dataKey={t.key} name={t.nombre} stackId="v" fill={t.color} stroke="#fff" strokeWidth={2}
                    radius={i === TIPOS.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={44} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel grafica">
          <h2>Ventas por parque</h2>
          {porParque.length === 0 ? <p className="texto-suave">Sin ventas en este filtro.</p> : (
            <ul className="barras-h">
              {porParque.map((p) => (
                <li key={p.nombre}>
                  <span className="barras-h__nombre">{p.nombre}</span>
                  <span className="barras-h__pista">
                    <span className="barras-h__barra" style={{ width: `${(p.total / porParque[0].total) * 100}%`, background: colorParque(p.nombre) }} />
                  </span>
                  <span className="barras-h__valor">{money(p.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel grafica">
          <h2>Calificación por parque</h2>
          {calif && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={califParques} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#E3ECEA" />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: '#55717A', fontSize: 12 }} />
                <YAxis type="category" dataKey="nombre" width={72} tickLine={false} axisLine={false} tick={{ fill: '#10333B', fontSize: 13 }} />
                <Tooltip content={<TooltipSimple formato={(v) => `${Number(v).toFixed(2)} estrellas`} />} cursor={{ fill: 'rgba(11,79,92,0.06)' }} />
                <Bar dataKey="promedio" radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: 'right', fill: '#10333B', fontSize: 12, formatter: (v) => Number(v).toFixed(1) }}>
                  {califParques.map((p) => <Cell key={p.nombre} fill={colorParque(p.nombre)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel grafica">
          <h2>Registros de visita</h2>
          <table className="tabla tabla--compacta">
            <thead><tr><th>Registro</th><th>Pago</th><th className="num">Cantidad</th></tr></thead>
            <tbody>
              {resumen?.registros_por_estado?.map((r, i) => (
                <tr key={i}>
                  <td><Estado valor={r.estado_registro} /></td>
                  <td><Estado valor={r.estado_pago} /></td>
                  <td className="num"><strong>{r.total}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel grafica">
          <h2>Códigos QR por estado</h2>
          <table className="tabla tabla--compacta">
            <thead><tr><th>Estado</th><th className="num">Cantidad</th></tr></thead>
            <tbody>
              {resumen?.codigos_qr_por_estado?.map((q) => (
                <tr key={q.estado}><td><Estado valor={q.estado} /></td><td className="num"><strong>{q.total}</strong></td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel grafica grafica--ancha">
          <h2>QR validados por empleado</h2>
          {validaciones?.empleados?.length === 0 && <p className="texto-suave">Nadie ha validado códigos en este rango.</p>}
          {validaciones?.empleados?.length > 0 && (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr><th>Empleado</th><th className="num">Entrada y parqueo</th><th className="num">Pedidos</th><th className="num">Rechazados</th><th>Proporción</th></tr>
                </thead>
                <tbody>
                  {validaciones.empleados.map((e) => (
                    <tr key={e.empleado_id}>
                      <td><strong>{e.nombres} {e.apellidos}</strong><br /><small className="texto-suave">{e.email}</small></td>
                      <td className="num">{e.qr_entrada_parqueo_validados}</td>
                      <td className="num">{e.qr_pedidos_validados}</td>
                      <td className="num">{e.total_rechazados}</td>
                      <td>
                        <span className="mini-barra" title={`${e.total_validados} validados, ${e.total_rechazados} rechazados`}>
                          <span style={{ width: `${(e.total_validados / maxValid) * 100}%` }} className="mini-barra__ok" />
                          <span style={{ width: `${(e.total_rechazados / maxValid) * 100}%` }} className="mini-barra__no" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {calif?.distribucion_estrellas && (
          <section className="panel grafica grafica--ancha">
            <h2>Opiniones de los visitantes</h2>
            <div className="opiniones">
              <ul className="barras-h barras-h--estrellas" aria-label="Calificaciones por número de estrellas">
                {calif.distribucion_estrellas.map((d) => (
                  <li key={d.estrellas}>
                    <span className="barras-h__nombre">{d.estrellas} ★</span>
                    <span className="barras-h__pista">
                      <span className="barras-h__barra" style={{ width: `${(d.total / maxEstrellas) * 100}%`, background: 'var(--maiz)' }} />
                    </span>
                    <span className="barras-h__valor">{d.total}</span>
                  </li>
                ))}
              </ul>
              <div>
                <h3 className="opiniones__titulo">Comentarios recientes</h3>
                {calif.comentarios_recientes?.length ? (
                  <ul className="comentarios">
                    {calif.comentarios_recientes.map((c) => (
                      <li key={c.id}>
                        <div className="comentarios__cabeza">
                          <span className="comentarios__estrellas" aria-label={`${c.puntuacion} de 5`}>{'★'.repeat(c.puntuacion)}<span>{'★'.repeat(5 - c.puntuacion)}</span></span>
                          <span className="texto-suave">{c.parque_nombre}, {fechaLarga(c.created_at, true)}</span>
                        </div>
                        <p>{c.comentario}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="texto-suave">Aún no hay comentarios.</p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="panel grafica grafica--ancha">
          <h2>Más reportes</h2>
          <div className="pestanas pestanas--chicas" role="tablist">
            {EXTRA.map((x) => (
              <button key={x.slug} role="tab" aria-selected={extra === x.slug} className={extra === x.slug ? 'activa' : ''} onClick={() => setExtra(x.slug)}>
                {x.titulo}
              </button>
            ))}
          </div>
          {reporteExtra.loading && <Loader />}
          {reporteExtra.error?.status === 404 ? (
            <AvisoEndpoint ruta={`GET /api/reportes/${extra}`} descripcion={EXTRA.find((x) => x.slug === extra).desc} />
          ) : (
            <ErrorApi error={reporteExtra.error} />
          )}
          {reporteExtra.data && <TablaGenerica filas={aFilas(reporteExtra.data)} />}
        </section>
      </div>
    </div>
  );
}
