import {
  Archive,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  History,
  Lock,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Ticket,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { visitasApi } from '../../api/endpoints';
import { Encabezado, ErrorApi, Estado, Loader, MarcaParque, Vacio } from '../../components/ui';
import { fechaHora, fechaLarga, money, plural } from '../../utils/format';
import { colorParque, temaParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

export default function HistorialCliente() {
  const { data, error, loading } = useAsync(() => visitasApi.historial(), []);
  const [tipoFiltro, setTipoFiltro] = useState('TODOS'); // 'TODOS' | 'VISITAS' | 'PEDIDOS'
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS'); // 'TODOS' | 'PAGADO' | 'PENDIENTE' | 'ENTREGADO' | 'ACTIVO'

  if (loading) return <Loader texto="Consultando tu historial oficial en el servidor…" />;
  if (error) return <div className="pagina"><ErrorApi error={error} /></div>;

  const resumen = data?.resumen || {};
  const registros = data?.registros || [];
  const pedidos = data?.pedidos || [];

  // Mapear a una lista cronológica unificada
  const itemsUnificados = [
    ...registros.map((r) => ({
      ...r,
      itemTipo: 'VISITA',
      fechaOrden: new Date(r.created_at || r.fecha_visita).getTime(),
      estadoPrincipal: r.estado_registro === 'CERRADO' ? 'CERRADO' : r.estado_pago
    })),
    ...pedidos.map((p) => ({
      ...p,
      itemTipo: 'PEDIDO',
      fechaOrden: new Date(p.created_at).getTime(),
      estadoPrincipal: p.estado
    }))
  ].sort((a, b) => b.fechaOrden - a.fechaOrden);

  // Filtrado por tipo
  const itemsPorTipo = itemsUnificados.filter((item) => {
    if (tipoFiltro === 'VISITAS') return item.itemTipo === 'VISITA';
    if (tipoFiltro === 'PEDIDOS') return item.itemTipo === 'PEDIDO';
    return true;
  });

  // Filtrado por estado
  const itemsFiltrados = itemsPorTipo.filter((item) => {
    if (estadoFiltro === 'TODOS') return true;
    if (estadoFiltro === 'PAGADO') return item.estado_pago === 'PAGADO' || item.estado === 'PAGADO';
    if (estadoFiltro === 'PENDIENTE') return item.estado_pago === 'PENDIENTE' || item.estado === 'PENDIENTE';
    if (estadoFiltro === 'ENTREGADO') return item.estado === 'ENTREGADO';
    if (estadoFiltro === 'ACTIVO') return item.estado_registro === 'ACTIVO';
    return true;
  });

  return (
    <div className="pagina">
      <Encabezado
        titulo="Historial de visitas y pedidos"
        volver={{ to: '/cliente', texto: 'Mis visitas' }}
        acciones={
          <div className="acciones-encabezado">
            <Link to="/cliente/visitas/nueva" className="btn btn--primario btn--chico">
              <Ticket size={16} /> Nueva visita
            </Link>
            <Link to="/cliente/pedidos/nuevo" className="btn btn--secundario btn--chico">
              <ShoppingBag size={16} /> Nuevo pedido
            </Link>
          </div>
        }
      >
        Consulta el estado de todos tus registros de visita y pedidos de brazaletes o tickets de juego.
      </Encabezado>

      {/* Tarjetas de Métricas provistas por el Backend */}
      <div className="kpis">
        <div className="kpi">
          <span>Visitas registradas</span>
          <strong>{resumen.total_visitas || 0}</strong>
          <small>{resumen.visitas_pagadas || 0} pagadas · {resumen.visitas_pendientes || 0} pendientes</small>
        </div>
        <div className="kpi">
          <span>Visitas activas</span>
          <strong>{resumen.visitas_activas || 0}</strong>
          <small>Disponibles para ingresar al parque</small>
        </div>
        <div className="kpi">
          <span>Pedidos de productos</span>
          <strong>{resumen.total_pedidos || 0}</strong>
          <small>{resumen.pedidos_pagados || 0} pagados · {resumen.pedidos_entregados || 0} entregados</small>
        </div>
        <div className="kpi">
          <span>Pedidos pendientes</span>
          <strong>{resumen.pedidos_pendientes || 0}</strong>
          <small>Por pagar en línea</small>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filtros" style={{ marginTop: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div className="pestanas pestanas--chicas" role="tablist">
          <button
            role="tab"
            aria-selected={tipoFiltro === 'TODOS'}
            className={tipoFiltro === 'TODOS' ? 'activa' : ''}
            onClick={() => setTipoFiltro('TODOS')}
          >
            Todo ({itemsUnificados.length})
          </button>
          <button
            role="tab"
            aria-selected={tipoFiltro === 'VISITAS'}
            className={tipoFiltro === 'VISITAS' ? 'activa' : ''}
            onClick={() => setTipoFiltro('VISITAS')}
          >
            Visitas ({registros.length})
          </button>
          <button
            role="tab"
            aria-selected={tipoFiltro === 'PEDIDOS'}
            className={tipoFiltro === 'PEDIDOS' ? 'activa' : ''}
            onClick={() => setTipoFiltro('PEDIDOS')}
          >
            Pedidos ({pedidos.length})
          </button>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', fontSize: '0.875rem' }}>
          <Filter size={16} /> Estado:
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="PAGADO">Pagado</option>
            <option value="PENDIENTE">Pendiente de pago</option>
            <option value="ENTREGADO">Entregado en taquilla</option>
            <option value="ACTIVO">Visitas activas</option>
          </select>
        </label>
      </div>

      {/* Listado de elementos */}
      {itemsFiltrados.length === 0 ? (
        <Vacio
          icono={Archive}
          titulo="No se encontraron registros en este filtro"
          accion={
            tipoFiltro === 'PEDIDOS' ? (
              <Link to="/cliente/pedidos/nuevo" className="btn btn--primario">Hacer un pedido</Link>
            ) : (
              <Link to="/cliente/visitas/nueva" className="btn btn--primario">Planear una visita</Link>
            )
          }
        >
          {tipoFiltro === 'TODOS'
            ? 'Aún no tienes actividad registrada.'
            : 'Prueba cambiando los filtros de tipo o estado arriba.'}
        </Vacio>
      ) : (
        <ul className="movimientos" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {itemsFiltrados.map((item) => {
            const esVisita = item.itemTipo === 'VISITA';
            const color = colorParque(item.parque_nombre);

            return (
              <li
                key={`${item.itemTipo}-${item.id}`}
                className="movimiento"
                style={{
                  '--parque': color,
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'var(--blanco, #fff)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <span className="movimiento__barra" />

                <div className="movimiento__info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        background: esVisita ? 'rgba(11, 79, 92, 0.08)' : 'rgba(122, 79, 181, 0.1)',
                        color: esVisita ? '#0B4F5C' : '#7A4FB5'
                      }}
                    >
                      {esVisita ? 'Visita' : 'Pedido'}
                    </span>
                    <strong style={{ fontSize: '1.05rem' }}>
                      {esVisita ? item.codigo_registro : item.numero_pedido}
                    </strong>
                    <MarcaParque nombre={item.parque_nombre} tamano="sm" />
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#55717A', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <span>
                      <Calendar size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '3px' }} />
                      Visita: {fechaLarga(item.fecha_visita, true)}
                    </span>
                    {esVisita ? (
                      <>
                        <span>
                          <Users size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '3px' }} />
                          {plural(item.total_personas, 'persona', 'personas')}
                        </span>
                        {item.tiene_vehiculo && (
                          <span>
                            <Car size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '3px' }} />
                            Con parqueo
                          </span>
                        )}
                        {item.tiene_carnet && <span>Carnet aplicado</span>}
                      </>
                    ) : (
                      <span>Registrado el {fechaHora(item.created_at)}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <Estado valor={item.estadoPrincipal} />
                  <strong className="movimiento__monto" style={{ fontSize: '1.1rem' }}>
                    {money(item.total)}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {esVisita ? (
                    item.estado_pago === 'PENDIENTE' && item.estado_registro === 'ACTIVO' ? (
                      <Link to={`/cliente/visitas/${item.id}/pagar`} className="btn btn--primario btn--chico">
                        <CreditCard size={14} /> Pagar
                      </Link>
                    ) : (
                      <Link to={`/cliente/visitas/${item.id}`} className="btn btn--secundario btn--chico">
                        Ver detalle
                      </Link>
                    )
                  ) : (
                    item.estado === 'PENDIENTE' ? (
                      item.registro_estado_pago === 'PAGADO' ? (
                        <Link to={`/cliente/pedidos/${item.id}/pagar`} className="btn btn--primario btn--chico">
                          <CreditCard size={14} /> Pagar
                        </Link>
                      ) : (
                        <Link to={`/cliente/visitas/${item.registro_visita_id}/pagar`} className="btn btn--secundario btn--chico" title="Pagar entrada primero">
                          <Lock size={14} /> Pagar entrada
                        </Link>
                      )
                    ) : (
                      <Link to={`/cliente/pedidos/${item.id}`} className="btn btn--secundario btn--chico">
                        Ver pedido
                      </Link>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
