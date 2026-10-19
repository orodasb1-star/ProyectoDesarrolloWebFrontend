import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { decodeJwt, getSession, onSessionChange, setSession } from '../api/client';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const HOME_POR_ROL = {
  CLIENTE: '/cliente',
  EMPLEADO: '/empleado',
  ADMINISTRADOR: '/admin'
};

function rolDeSesion(s) {
  if (!s?.access_token) return null;
  return decodeJwt(s.access_token)?.rol || null;
}

export function AuthProvider({ children }) {
  const [session, setLocalSession] = useState(getSession());
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(getSession()));

  useEffect(() => onSessionChange(setLocalSession), []);

  const cargarPerfil = useCallback(async () => {
    if (!getSession()) {
      setUsuario(null);
      setCargando(false);
      return null;
    }
    try {
      const me = await authApi.me();
      setUsuario(me);
      return me;
    } catch {
      setSession(null);
      setUsuario(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (session && !usuario) cargarPerfil();
    if (!session) {
      setUsuario(null);
      setCargando(false);
    }
  }, [session, usuario, cargarPerfil]);

  const login = useCallback(async (email, password) => {
    const tokens = await authApi.login(email, password);
    setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
    const me = await authApi.me();
    setUsuario(me);
    return me.rol || rolDeSesion(tokens);
  }, []);

  const logout = useCallback(async () => {
    const s = getSession();
    if (s?.refresh_token) await authApi.revoke(s.refresh_token);
    setSession(null);
    setUsuario(null);
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      rol: usuario?.rol || rolDeSesion(session),
      autenticado: Boolean(session),
      cargando,
      login,
      logout,
      recargarPerfil: cargarPerfil
    }),
    [usuario, session, cargando, login, logout, cargarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
