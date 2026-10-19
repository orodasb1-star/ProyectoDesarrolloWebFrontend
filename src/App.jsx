import { Navigate, Route, Routes } from 'react-router-dom';
import { Marco, RutaProtegida } from './components/Layout';
import { Loader } from './components/ui';
import { HOME_POR_ROL, useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';

import MisVisitas from './pages/cliente/MisVisitas';
import NuevaVisita from './pages/cliente/NuevaVisita';
import PagoRegistro from './pages/cliente/PagoRegistro';
import DetalleRegistro from './pages/cliente/DetalleRegistro';
import CalificarVisita from './pages/cliente/CalificarVisita';
import MisPedidos from './pages/cliente/MisPedidos';
import NuevoPedido from './pages/cliente/NuevoPedido';
import { DetallePedido, PagoPedido } from './pages/cliente/DetallePedido';

import Escanear from './pages/empleado/Escanear';
import DetalleQR from './pages/empleado/DetalleQR';
import MisValidaciones from './pages/empleado/MisValidaciones';

import Reportes from './pages/admin/Reportes';
import Parques from './pages/admin/Parques';
import Productos from './pages/admin/Productos';
import Precios from './pages/admin/Precios';
import Usuarios from './pages/admin/Usuarios';
import Notificaciones from './pages/admin/Notificaciones';

function Inicio() {
  const { autenticado, rol, cargando } = useAuth();
  if (cargando) return <Loader pantalla />;
  if (!autenticado || !rol) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_POR_ROL[rol] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Zona del cliente */}
      <Route element={<RutaProtegida roles={['CLIENTE']} />}>
        <Route path="/cliente" element={<Marco />}>
          <Route index element={<MisVisitas />} />
          <Route path="visitas/nueva" element={<NuevaVisita />} />
          <Route path="visitas/:id" element={<DetalleRegistro />} />
          <Route path="visitas/:id/pagar" element={<PagoRegistro />} />
          <Route path="visitas/:id/calificar" element={<CalificarVisita />} />
          <Route path="pedidos" element={<MisPedidos />} />
          <Route path="pedidos/nuevo" element={<NuevoPedido />} />
          <Route path="pedidos/:id" element={<DetallePedido />} />
          <Route path="pedidos/:id/pagar" element={<PagoPedido />} />
        </Route>
      </Route>

      {/* Zona del empleado (taquilla). El backend también deja escanear al administrador. */}
      <Route element={<RutaProtegida roles={['EMPLEADO']} />}>
        <Route path="/empleado" element={<Marco />}>
          <Route index element={<Escanear />} />
          <Route path="qr/:codigo" element={<DetalleQR />} />
          <Route path="validaciones" element={<MisValidaciones />} />
        </Route>
      </Route>

      {/* Zona del administrador */}
      <Route element={<RutaProtegida roles={['ADMINISTRADOR']} />}>
        <Route path="/admin" element={<Marco />}>
          <Route index element={<Reportes />} />
          <Route path="parques" element={<Parques />} />
          <Route path="productos" element={<Productos />} />
          <Route path="precios" element={<Precios />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="notificaciones" element={<Notificaciones />} />
        </Route>
      </Route>

      <Route path="*" element={<Inicio />} />
    </Routes>
  );
}
