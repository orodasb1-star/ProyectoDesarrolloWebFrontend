-- =============================================================================
-- Corrección para el BACKEND (no es parte del frontend)
-- La migración 1710000000001_permisos_roles.js no concede SELECT sobre tablas
-- que los servicios sí consultan. Sin esto fallan con "permission denied":
--   * visits-service  -> cotizar/crear registro (productos) y calificar (codigos_qr)
--   * qr-service      -> escanear un QR (parques, acompanantes, detalle_pedido, ...)
--   * notifications   -> correo de QR entregado (codigos_qr)
-- Ejecutar como irtra_admin, o agregar estas líneas a la migración de permisos.
-- =============================================================================
GRANT SELECT ON productos, codigos_qr TO visits_user;
GRANT SELECT ON parques, acompanantes, detalle_pedido, parque_productos, productos TO qr_user;
GRANT SELECT ON codigos_qr TO notifications_user;
