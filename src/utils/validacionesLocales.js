// Respaldo local para "Mis validaciones del día" mientras el backend no expone
// GET /qr/mis-validaciones. Guarda en este navegador lo que el empleado valida aquí.

const clave = (empleadoId) => `irtra.validaciones.${empleadoId}`;

export function leerValidaciones(empleadoId) {
  try {
    return JSON.parse(localStorage.getItem(clave(empleadoId)) || '[]');
  } catch {
    return [];
  }
}

export function guardarValidacion(empleadoId, item) {
  try {
    const lista = leerValidaciones(empleadoId);
    lista.unshift({ ...item, fecha: new Date().toISOString() });
    localStorage.setItem(clave(empleadoId), JSON.stringify(lista.slice(0, 300)));
  } catch {
    /* sin almacenamiento disponible */
  }
}
