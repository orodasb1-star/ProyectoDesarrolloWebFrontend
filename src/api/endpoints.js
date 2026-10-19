// Mapa de endpoints del backend (API Gateway Nginx → microservicios).
// Todas las rutas son relativas a VITE_API_URL (por defecto /api).
// Las marcadas como [PROPUESTO] aún no existen en el backend entregado;
// la UI las intenta y, si responden 404, muestra un aviso (ver ENDPOINTS_FALTANTES.md).

import { api, newIdempotencyKey } from './client';

const unwrap = (r) => r?.data;

// ---------------- auth-service ----------------
export const authApi = {
  login: (email, password) =>
    api.post('/auth/oauth/token', { grant_type: 'password', username: email, password }, { auth: false }),
  register: (payload) => api.post('/auth/register', payload, { auth: false }).then(unwrap),
  revoke: (refreshToken) => api.post('/auth/oauth/revoke', { token: refreshToken }).catch(() => null),
  me: () => api.get('/auth/me').then(unwrap),
  crearEmpleado: (payload) => api.post('/auth/admin/empleados', payload).then(unwrap),
  // [PROPUESTO] listado y activación/desactivación de usuarios
  listarUsuarios: (rol) => api.get('/auth/admin/usuarios', { query: { rol } }).then(unwrap),
  cambiarEstadoUsuario: (id, activo) => api.patch(`/auth/admin/usuarios/${id}`, { activo }).then(unwrap)
};

// ---------------- catalog-service ----------------
export const catalogoApi = {
  parques: () => api.get('/catalogo/parques', { auth: false }).then(unwrap),
  // Admin: todos los parques (incluye inactivos) y catálogo global de productos
  todosLosParques: () => api.get('/catalogo/admin/parques').then(unwrap),
  productos: () => api.get('/catalogo/productos').then(unwrap),
  productosDeParque: (parqueId, fecha) =>
    api.get(`/catalogo/parques/${parqueId}/productos`, { auth: false, query: { fecha } }).then(unwrap),
  crearParque: (payload) => api.post('/catalogo/parques', payload).then(unwrap),
  actualizarParque: (id, payload) => api.put(`/catalogo/parques/${id}`, payload).then(unwrap),
  crearProducto: (payload) => api.post('/catalogo/productos', payload).then(unwrap),
  eliminarProducto: (id) => api.del(`/catalogo/productos/${id}`).then(unwrap),
  guardarOferta: (payload) => api.put('/catalogo/parque-productos', payload).then(unwrap),
  retirarOferta: (id) => api.del(`/catalogo/parque-productos/${id}`).then(unwrap)
};

// ---------------- visits-service ----------------
export const visitasApi = {
  cotizar: (payload) => api.post('/visitas/registros/cotizar', payload).then(unwrap),
  crearRegistro: (payload) => api.post('/visitas/registros', payload).then(unwrap),
  registros: (historial = false) =>
    api.get('/visitas/registros', { query: historial ? { historial: 'true' } : undefined }).then(unwrap),
  registro: (id) => api.get(`/visitas/registros/${id}`).then(unwrap),
  crearPedido: (registroId, items) => api.post(`/visitas/registros/${registroId}/pedidos`, { items }).then(unwrap),
  misPedidos: () => api.get('/visitas/pedidos').then(unwrap),
  pedidosDeRegistro: (registroId) => api.get(`/visitas/registros/${registroId}/pedidos`).then(unwrap),
  pedido: (id) => api.get(`/visitas/pedidos/${id}`).then(unwrap),
  calificar: (payload) => api.post('/visitas/calificaciones', payload).then(unwrap)
};

// ---------------- payments-service ----------------
// Cada intento de pago lleva su propio Idempotency-Key: si el usuario hace doble clic
// o la red reintenta, el backend no cobra dos veces.
export const pagosApi = {
  pagarRegistro: (registroId, payload, key = newIdempotencyKey()) =>
    api.post(`/pagos/registro/${registroId}`, payload, { headers: { 'Idempotency-Key': key } }),
  pagarPedido: (pedidoId, payload, key = newIdempotencyKey()) =>
    api.post(`/pagos/pedido/${pedidoId}`, payload, { headers: { 'Idempotency-Key': key } }),
  misPagos: () => api.get('/pagos/mis-pagos').then(unwrap)
};

// ---------------- qr-service ----------------
export const qrApi = {
  misCodigos: () => api.get('/qr/mis-codigos').then(unwrap),
  escanear: (codigo) => api.post('/qr/escanear', { codigo }).then(unwrap),
  validarEntregar: (qrId) => api.post(`/qr/${qrId}/validar-entregar`),
  // [PROPUESTO] historial de validaciones del empleado autenticado
  misValidaciones: (fecha) => api.get('/qr/mis-validaciones', { query: { fecha } }).then(unwrap)
};

// ---------------- reports-service (solo ADMINISTRADOR) ----------------
export const reportesApi = {
  resumen: () => api.get('/reportes/resumen').then(unwrap),
  calificaciones: () => api.get('/reportes/calificaciones').then(unwrap),
  validacionesPorEmpleado: (filtros) => api.get('/reportes/validaciones-por-empleado', { query: filtros }).then(unwrap),
  ventas: (filtros) => api.get('/reportes/ventas', { query: filtros }).then(unwrap),
  // [PROPUESTO] reportes adicionales del documento de requisitos
  extra: (slug, filtros) => api.get(`/reportes/${slug}`, { query: filtros }).then(unwrap),
  // [PROPUESTO] notificaciones fallidas
  notificaciones: (estado) => api.get('/reportes/notificaciones', { query: { estado } }).then(unwrap)
};
