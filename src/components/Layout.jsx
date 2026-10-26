import {
  BarChart3,
  Bell,
  ClipboardList,
  History,
  LogOut,
  MapPinned,
  Package,
  PlusCircle,
  QrCode,
  ReceiptText,
  Tags,
  Ticket,
  Users
} from 'lucide-react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HOME_POR_ROL, useAuth } from '../context/AuthContext';
import { Faja, Loader, Logo } from './ui';

const MENUS = {
  CLIENTE: [
    { to: '/cliente', texto: 'Mis visitas', icono: Ticket, end: true },
    { to: '/cliente/visitas/nueva', texto: 'Nueva visita', icono: PlusCircle },
    { to: '/cliente/pedidos', texto: 'Mis pedidos', icono: ReceiptText },
    { to: '/cliente/historial', texto: 'Mi historial', icono: History }
  ],
  EMPLEADO: [
    { to: '/empleado', texto: 'Escanear', icono: QrCode, end: true },
    { to: '/empleado/validaciones', texto: 'Mis validaciones', icono: ClipboardList }
  ],
  ADMINISTRADOR: [
    { to: '/admin', texto: 'Reportes', icono: BarChart3, end: true },
    { to: '/admin/parques', texto: 'Parques', icono: MapPinned },
    { to: '/admin/productos', texto: 'Productos', icono: Package },
    { to: '/admin/precios', texto: 'Precios y oferta', icono: Tags },
    { to: '/admin/usuarios', texto: 'Usuarios', icono: Users },
    { to: '/admin/notificaciones', texto: 'Notificaciones', icono: Bell }
  ]
};

const ETIQUETA_ROL = { CLIENTE: 'Cliente', EMPLEADO: 'Taquilla', ADMINISTRADOR: 'Administración' };

/** Protege un grupo de rutas: exige sesión y que el rol esté permitido. */
export function RutaProtegida({ roles }) {
  const { autenticado, rol, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Loader pantalla texto="Verificando tu sesión…" />;
  if (!autenticado) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (roles && rol && !roles.includes(rol)) return <Navigate to={HOME_POR_ROL[rol] || '/login'} replace />;
  return <Outlet />;
}

/** Marco de la aplicación con navegación según el rol. */
export function Marco() {
  const { usuario, rol, logout } = useAuth();
  const navigate = useNavigate();
  const menu = MENUS[rol] || [];
  const esAdmin = rol === 'ADMINISTRADOR';

  async function salir() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`marco ${esAdmin ? 'marco--admin' : ''}`}>
      <header className="barra">
        <div className="barra__interior">
          <NavLink to={HOME_POR_ROL[rol] || '/'} className="barra__logo" aria-label="Inicio">
            <Logo claro />
          </NavLink>
          {!esAdmin && (
            <nav className="barra__nav" aria-label="Principal">
              {menu.map(({ to, texto, icono: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="barra__link">
                  <Icon size={18} />
                  {texto}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="barra__usuario">
            <span className="barra__nombre">
              {usuario ? `${usuario.nombres?.split(' ')[0] || ''}` : ''}
              <small>{ETIQUETA_ROL[rol]}</small>
            </span>
            <button className="btn-icono" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <Faja />
      </header>

      <div className="marco__cuerpo">
        {esAdmin && (
          <aside className="lateral" aria-label="Administración">
            {menu.map(({ to, texto, icono: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="lateral__link">
                <Icon size={18} />
                <span>{texto}</span>
              </NavLink>
            ))}
          </aside>
        )}
        <main className="contenido">
          <Outlet />
        </main>
      </div>

      {!esAdmin && (
        <nav className="tabbar" aria-label="Navegación móvil">
          {menu.map(({ to, texto, icono: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="tabbar__link">
              <Icon size={22} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
