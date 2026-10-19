// Cliente HTTP central. Maneja el access token (JWT RS256 de 15 min),
// la rotación automática con refresh_token y el formato de errores del backend:
// { success:false, statusCode, message, errors? }

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const STORAGE_KEY = 'irtra.session';

export class ApiError extends Error {
  constructor(message, status, errors = null, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.body = body;
  }

  /** Lista legible de errores de validación (Zod) que devuelve el backend. */
  get detalles() {
    if (Array.isArray(this.errors)) {
      return this.errors.map((e) => (e.campo ? `${e.campo}: ${e.mensaje}` : e.mensaje));
    }
    return [];
  }
}

// ---------- Sesión ----------
let session = readSession();
const listeners = new Set();

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  return session;
}

export function setSession(next) {
  session = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
  listeners.forEach((fn) => fn(next));
}

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Decodifica el payload del JWT (sin verificar firma; solo para leer el rol). */
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ---------- Refresh token (una sola rotación a la vez) ----------
let refreshPromise = null;

async function refreshAccessToken() {
  if (!session?.refresh_token) throw new ApiError('Sesión expirada', 401);
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${BASE_URL}/auth/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: session.refresh_token })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.access_token) {
        setSession(null);
        throw new ApiError(body?.message || 'Tu sesión expiró. Vuelve a iniciar sesión.', 401);
      }
      setSession({ ...session, access_token: body.access_token, refresh_token: body.refresh_token });
      return body.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// PostgreSQL devuelve los BIGSERIAL como texto ("12"). Los convertimos a número
// en un solo lugar para que las comparaciones de IDs funcionen en toda la app.
function normalizarIds(valor) {
  if (Array.isArray(valor)) return valor.map(normalizarIds);
  if (valor && typeof valor === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(valor)) {
      if ((k === 'id' || k.endsWith('_id')) && typeof v === 'string' && /^\d+$/.test(v)) out[k] = Number(v);
      else out[k] = normalizarIds(v);
    }
    return out;
  }
  return valor;
}

// ---------- Petición genérica ----------
export async function request(path, { method = 'GET', body, headers = {}, auth = true, query, retry = true } = {}) {
  let url = `${BASE_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth && session?.access_token) finalHeaders.Authorization = `Bearer ${session.access_token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa que el backend esté levantado.', 0);
  }

  if (res.status === 401 && auth && retry && session?.refresh_token) {
    await refreshAccessToken();
    return request(path, { method, body, headers, auth, query, retry: false });
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? normalizarIds(JSON.parse(text)) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok || data?.success === false) {
    const message =
      data?.message ||
      (res.status === 429 ? 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' : `Error ${res.status}`);
    throw new ApiError(message, res.status, data?.errors ?? null, data);
  }

  return data;
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  patch: (p, body, opts) => request(p, { ...opts, method: 'PATCH', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' })
};

export function newIdempotencyKey() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
