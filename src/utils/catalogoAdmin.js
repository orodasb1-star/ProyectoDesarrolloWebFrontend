import { catalogoApi } from '../api/endpoints';

// El backend no tiene GET /productos. Para que el administrador pueda elegir productos
// se juntan los que aparecen en el catálogo de cada parque + los creados desde este navegador.

const CLAVE = 'irtra.productosCreados';

export function leerProductosCreados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '[]');
  } catch {
    return [];
  }
}

export function recordarProducto(p) {
  try {
    const lista = leerProductosCreados().filter((x) => x.id !== p.id);
    lista.push({ id: p.id, nombre: p.nombre, codigo: p.codigo, tipo: p.tipo, activo: p.activo !== false });
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    /* sin almacenamiento */
  }
}

export function marcarProductoInactivo(id) {
  try {
    const lista = leerProductosCreados().map((x) => (x.id === id ? { ...x, activo: false } : x));
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    /* sin almacenamiento */
  }
}

export async function cargarProductosConocidos() {
  // Preferir GET /catalogo/productos (admin). Si no existe en el backend, usar el respaldo.
  try {
    const productos = await catalogoApi.productos();
    return productos.map((p) => ({ ...p, parques: p.ofertas_en_linea ?? 0 }));
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  const parques = await catalogoApi.parques();
  const catalogos = await Promise.all(parques.map((p) => catalogoApi.productosDeParque(p.id).catch(() => [])));
  const mapa = new Map();
  catalogos.flat().forEach((o) => {
    const prev = mapa.get(o.producto_id);
    mapa.set(o.producto_id, {
      id: o.producto_id,
      nombre: o.nombre,
      codigo: o.codigo,
      tipo: o.tipo,
      descripcion: o.descripcion,
      activo: true,
      parques: (prev?.parques || 0) + 1
    });
  });
  leerProductosCreados().forEach((p) => {
    if (!mapa.has(p.id)) mapa.set(p.id, { ...p, parques: 0 });
    else if (p.activo === false) mapa.set(p.id, { ...mapa.get(p.id), activo: false });
  });
  return [...mapa.values()].sort((a, b) => a.id - b.id);
}
