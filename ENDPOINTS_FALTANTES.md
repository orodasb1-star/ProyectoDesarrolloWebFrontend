# Endpoints que el frontend necesita y el backend todavía no tiene

> **Actualización:** todos los endpoints de esta lista (y las mejoras opcionales de listar
> productos, parques inactivos, todos los pedidos y `validado_por`) están implementados y
> probados en los parches de la carpeta `parches-backend/` (ver su `LEEME.txt`). Mientras
> no se apliquen, el frontend sigue funcionando con los avisos y respaldos descritos aquí.

El documento de requisitos pide pantallas cuyos datos no expone ningún microservicio.
El frontend **ya tiene esas pantallas hechas**: llaman a las rutas de abajo y, si el backend
responde 404, muestran un aviso amarillo en vez de romperse. En cuanto el backend agregue
la ruta con el formato indicado, la pantalla funciona sin tocar el frontend.

Además hay **un bug de permisos** en la base de datos que sí bloquea flujos principales:
ver `docs/backend-permisos-faltantes.sql`.

| Pantalla | Ruta esperada | Servicio | Respuesta esperada (`data`) |
|---|---|---|---|
| Admin › Usuarios (listar) | `GET /api/auth/admin/usuarios?rol=EMPLEADO\|CLIENTE` | auth | `[{ id, nombres, apellidos, email, carnet, activo, created_at }]` |
| Admin › Usuarios (desactivar/activar) | `PATCH /api/auth/admin/usuarios/:id` body `{ "activo": false }` | auth | usuario actualizado |
| Admin › Notificaciones | `GET /api/reportes/notificaciones?estado=FALLIDO` | reports | `[{ id, tipo, destinatario, estado, error, created_at }]` |
| Admin › Reportes › Validaciones rechazadas | `GET /api/reportes/validaciones-rechazadas?fecha_inicio&fecha_fin` | reports | arreglo de filas (ej. `{ motivo, total }`) |
| Admin › Reportes › Visitas | `GET /api/reportes/visitas` | reports | arreglo de filas |
| Admin › Reportes › Visitantes | `GET /api/reportes/visitantes` | reports | `[{ parque_nombre, ninos, adultos, adultos_mayores }]` |
| Admin › Reportes › Productos más vendidos | `GET /api/reportes/productos-mas-vendidos` | reports | `[{ producto, parque, cantidad, total }]` |
| Admin › Reportes › Salud de la app | `GET /api/reportes/salud` | reports | arreglo de filas |
| Admin › Reportes › Usuarios nuevos | `GET /api/reportes/usuarios` | reports | `[{ fecha, nuevos, con_carnet }]` |
| Empleado › Mis validaciones del día | `GET /api/qr/mis-validaciones?fecha=YYYY-MM-DD` | qr | `[{ codigo_qr_id, tipo, parque, titular, resultado, fecha_validacion }]` |

Los reportes "extra" se pintan con una tabla genérica: cualquier arreglo de objetos sirve.

## Mejoras opcionales (el frontend ya las aprovecha si llegan)

- **`POST /api/qr/escanear`**: agregar `validado_por` (nombre del empleado) cuando el QR ya
  está `ENTREGADO`. El requisito dice que el mensaje "Este código ya fue utilizado" muestre
  fecha, hora **y empleado**; hoy el backend solo envía la fecha.
- **`GET /api/catalogo/productos`** (admin): listar el catálogo global. Hoy el frontend lo
  reconstruye juntando el catálogo de cada parque más los productos creados desde el navegador.
- **`GET /api/catalogo/parques?todos=true`** (admin): incluir parques inactivos para poder
  reactivarlos. Hoy el frontend recuerda en el navegador los que se desactivaron desde ahí.
- **`GET /api/visitas/pedidos`**: listar todos los pedidos del cliente. Hoy "Mis pedidos"
  consulta los pedidos de cada registro del historial.
- **`POST /api/visitas/pedidos/cotizar`**: igual que la cotización de visitas, para que el
  total del pedido también venga del backend antes de crearlo.

## Mientras tanto (respaldos en el navegador)

| Función | Respaldo |
|---|---|
| Mis validaciones del día | Guarda en `localStorage` lo que el empleado valida desde ese dispositivo |
| Reactivar parques | Recuerda en `localStorage` los parques desactivados desde ese navegador |
| Lista de productos | Une catálogo de los parques + productos creados desde ese navegador |
