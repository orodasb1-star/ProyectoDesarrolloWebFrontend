import { catalogoApi } from '../api/endpoints';

// Catálogo global provisto directamente por el backend (catalog-service).
export async function cargarProductosConocidos() {
  const productos = await catalogoApi.productos();
  return productos.map((p) => ({ ...p, parques: p.ofertas_en_linea ?? 0 }));
}

export function recordarProducto() {}
export function marcarProductoInactivo() {}
export function leerProductosCreados() {
  return [];
}
