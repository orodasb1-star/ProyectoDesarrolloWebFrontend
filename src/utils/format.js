// Utilidades SOLO de presentación. Ningún monto se calcula en el frontend:
// todos los totales vienen del backend como string con 2 decimales ("140.00").

export function money(value) {
  if (value === null || value === undefined || value === '') return 'Q —';
  const n = Number(value);
  if (Number.isNaN(n)) return `Q ${value}`;
  return `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Fecha de hoy en Guatemala con formato YYYY-MM-DD (igual que el backend). */
export function hoyGuatemala() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/** Normaliza una fecha DATE de PostgreSQL ("2026-10-15T00:00:00.000Z" o "2026-10-15") a YYYY-MM-DD. */
export function soloFecha(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

/** "sábado 17 de octubre de 2026" (o versión corta). */
export function fechaLarga(value, corta = false) {
  const f = soloFecha(value);
  if (!f) return '—';
  const d = new Date(`${f}T12:00:00`);
  return d.toLocaleDateString('es-GT', corta
    ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function fechaHora(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-GT', {
    timeZone: 'America/Guatemala',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
}

export const CATEGORIA_LABEL = {
  NINO: 'Niño',
  ADULTO: 'Adulto',
  ADULTO_MAYOR: 'Adulto mayor',
  UNICA: 'Única'
};

/** "Boleto de Entrada (ADULTO_MAYOR)" → "Boleto de Entrada (Adulto mayor)" */
export function nombreLegible(nombre = '') {
  return nombre.replace(/\((NINO|ADULTO_MAYOR|ADULTO|UNICA)\)/, (_, c) => `(${CATEGORIA_LABEL[c]})`);
}

export const TIPO_PRODUCTO_LABEL = {
  ENTRADA: 'Entrada',
  PARQUEO: 'Parqueo',
  BRAZALETE: 'Brazalete',
  TICKET_JUEGO: 'Ticket de juego'
};

export const METODO_LABEL = {
  TARJETA: 'Tarjeta',
  DEPOSITO: 'Depósito',
  PAYPAL: 'PayPal',
  TRANSFERENCIA: 'Transferencia'
};

export function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}
