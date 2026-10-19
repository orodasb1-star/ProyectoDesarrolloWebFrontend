# IRTRA en línea — Frontend

Aplicación web (React + Vite) para comprar entradas, parqueo, brazaletes y tickets de
juego de los parques del IRTRA (Xocomil, Xetulul, Xejuyup y Xetulhá), validarlos en
taquilla con código QR y administrar parques, precios y reportes.

Consume el backend de microservicios (`ProyectoFinalDesarrolloWeb`) a través del API
Gateway en `/api/*`. **El frontend no calcula montos**: la cotización, el carnet, las
categorías de edad y los totales vienen siempre del backend.

## Requisitos

- Node.js 20 o superior
- El backend levantado con `docker compose up -d --build`, migraciones y seed aplicados
- **Aplicar `docs/backend-permisos-faltantes.sql`** en la base de datos (ver abajo)

## Ejecutar en desarrollo

```powershell
npm install
copy .env.example .env      # opcional, los valores por defecto ya sirven
npm run dev
```

Abre http://localhost:5173. Vite reenvía `/api` al gateway `https://localhost` (acepta su
certificado autofirmado y quita la cabecera `Origin` para que el CORS del backend no bloquee
el puerto 5173). Si el gateway está en otra dirección, cambia `VITE_PROXY_TARGET` en `.env`.

## Construir para producción

```powershell
npm run build      # genera dist/
```

Para servirlo con el mismo Nginx del backend (recomendado: mismo origen y HTTPS para la
cámara), sigue `docs/integracion-docker-compose.md`. Hay un `Dockerfile` listo.

## Cuentas de prueba (seed del backend)

Contraseña de todas: `Password123!`. En la pantalla de login hay un atajo para rellenarlas.

| Rol | Correo | Va a |
|---|---|---|
| Cliente con carnet | afiliado@gmail.com | `/cliente` |
| Cliente sin carnet | particular@gmail.com | `/cliente` |
| Empleado (taquilla) | taquilla@irtra.org.gt | `/empleado` |
| Administrador | admin@irtra.org.gt | `/admin` |

Tarjeta de prueba que **se rechaza**: cualquiera terminada en `0000`. Las demás se aprueban.

## Pantallas

**Comunes:** Login (redirige según el rol del token) y Registro de cliente (carnet opcional).
Las rutas están protegidas: si un empleado abre `/admin` vuelve a su zona.

**Cliente** (`/cliente`)
- Mis visitas: boletos con parque, fecha, estado del pago, "Ver QR" y "Pagar".
- Nueva visita en 3 pasos (parque y fecha, vehículo, acompañantes con edad) con resumen que
  se actualiza en vivo desde `POST /visitas/registros/cotizar`.
- Pago del registro: tarjeta, depósito, PayPal o transferencia; el formulario cambia según el
  método. Cada intento envía su `Idempotency-Key`. Si el carnet cubre todo (Q0.00) solo se confirma.
- Detalle del registro: desglose y QR. Pendiente = QR gris "Disponible al pagar".
- Mis pedidos (historial tipo banco), Nuevo pedido (solo brazaletes y tickets del parque de la
  visita; "Pagar" bloqueado con "Primero paga tu entrada"), pago y QR del pedido.
- Calificar visita (1 a 5 estrellas y comentario) cuando la entrada ya fue entregada.

**Empleado** (`/empleado`)
- Escanear: cámara (html5-qrcode) y campo de texto si el QR no se lee. Escanear no cambia nada.
- Detalle del QR con los casos: válido, pago pendiente, ya utilizado, expirado, otra fecha y
  pedido (lista de lo que hay que entregar). Botón "Validar y entregar".
- Mis validaciones del día.

**Administrador** (`/admin`)
- Reportes: recaudación, ventas por día (apiladas por entradas/parqueo/pedidos) y por parque,
  calificación por parque, registros y QR por estado, validaciones por empleado. Filtros de
  fecha y parque, vista de tabla.
- Parques: crear, editar descripción y máximo por carnet, desactivar/reactivar.
- Productos: crear y eliminar (queda desactivado).
- Precios y oferta: precio por parque y categoría, venta en línea sí/no, fechas de promoción.
- Usuarios: crear cuentas de empleado; listar y desactivar (requiere endpoint, ver abajo).
- Notificaciones fallidas (requiere endpoint).

## Lo que falta en el backend

Todo está resuelto en los 11 parches de `parches-backend/` (instrucciones en su `LEEME.txt`):
permisos de base de datos, migraciones en Docker, fechas, endpoints faltantes y el registro
de intentos rechazados en taquilla. Sin los parches, aplica al menos
`docs/backend-permisos-faltantes.sql`; las pantallas cuyo endpoint no existe muestran un aviso
(ver `ENDPOINTS_FALTANTES.md`) y usan respaldos en el navegador.

## Estructura

```
src/
  api/client.js        fetch con JWT, refresh token automático, errores del backend
  api/endpoints.js     todas las rutas del backend agrupadas por microservicio
  context/AuthContext  sesión, rol y redirección
  components/          Layout por rol, boleto, QR, formulario de pago, estrellas, UI base
  pages/auth|cliente|empleado|admin
  styles/global.css    sistema visual (paleta, tipografía, faja tejida, boletos)
  utils/               formato de moneda/fechas (solo presentación), colores por parque
```

## Diseño

Paleta tomada de los parques (laguna, maíz, selva, guacamaya); cada parque tiene su color
fijo en tarjetas y gráficas, revisado para daltonismo. Tipografías Bricolage Grotesque y
Figtree, incluidas en el proyecto (no dependen de Google Fonts). La franja tejida bajo la
barra superior se inspira en las fajas típicas guatemaltecas y las visitas se muestran como
boletos perforados. Diseño adaptable: en el celular la navegación pasa a una barra inferior.
