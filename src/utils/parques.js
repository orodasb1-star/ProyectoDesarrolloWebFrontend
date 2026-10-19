// Identidad visual de cada parque. Los colores están validados como paleta categórica
// (separación para daltonismo y contraste) y se usan igual en tarjetas y gráficas:
// el color sigue al parque, nunca a su posición.

const TEMAS = {
  XOC: { color: '#1B6FA8', suave: '#E3F0FA', lema: 'Toboganes, olas y sol de Retalhuleu', icono: 'waves' },
  XET: { color: '#E0663A', suave: '#FDEDE6', lema: 'Plazas del mundo y juegos mecánicos', icono: 'ferris' },
  XEJ: { color: '#2F9E6B', suave: '#E3F5EC', lema: 'Aventura, canopy y senderos', icono: 'trees' },
  XHA: { color: '#C2185B', suave: '#FBE5EE', lema: 'Naturaleza y descanso en familia', icono: 'leaf' }
};

const EXTRA = ['#6B5BB8', '#0E7C86', '#8A6D1F'];

export function temaParque(parque) {
  if (!parque) return { color: '#0B4F5C', suave: '#E6F1F0', lema: '', icono: 'ticket' };
  const codigo = (parque.codigo || parque.parque_codigo || '').toUpperCase();
  if (TEMAS[codigo]) return TEMAS[codigo];
  // Buscar por nombre (algunos endpoints solo devuelven parque_nombre)
  const nombre = (parque.nombre || parque.parque_nombre || parque || '').toString().toLowerCase();
  if (nombre.includes('xocomil')) return TEMAS.XOC;
  if (nombre.includes('xetulul')) return TEMAS.XET;
  if (nombre.includes('xejuyup')) return TEMAS.XEJ;
  if (nombre.includes('xetulh')) return TEMAS.XHA;
  const id = Number(parque.id || parque.parque_id || 0);
  return { color: EXTRA[id % EXTRA.length], suave: '#EEF1F6', lema: parque.descripcion || '', icono: 'ticket' };
}

export function colorParque(nombreOParque) {
  return temaParque(typeof nombreOParque === 'string' ? { nombre: nombreOParque } : nombreOParque).color;
}
