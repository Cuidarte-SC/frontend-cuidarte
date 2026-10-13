// Sesión del usuario (RF-1). Se guarda en sessionStorage: se borra al cerrar la pestaña.
// El token expira a los 15 min (NFR-SEG-9); al vencer, la sesión se cierra sola.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAlExpirarSesion, setToken } from './api';

const CLAVE = 'cuidarte_sesion';
const AuthContext = createContext(null);

const leerSesion = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLAVE));
    if (s && new Date(s.expira_en) > new Date()) {
      setToken(s.token);
      return s;
    }
  } catch {
    // sessionStorage no disponible o dato corrupto
  }
  return null;
};

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  const limpiar = useCallback(() => {
    setToken(null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // sin acción
    }
    setSesion(null);
  }, []);

  useEffect(() => {
    setAlExpirarSesion(limpiar);
  }, [limpiar]);

  // Cierre automático al expirar el token
  useEffect(() => {
    if (!sesion) return undefined;
    const ms = new Date(sesion.expira_en) - new Date();
    const t = setTimeout(limpiar, Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [sesion, limpiar]);

  const login = async (nombreUsuario, password) => {
    const datos = await api('/auth/login', {
      method: 'POST',
      body: { nombre_usuario: nombreUsuario, password },
    });
    setToken(datos.token);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      // sin acción
    }
    setSesion(datos);
    return datos.usuario;
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // aunque falle la red, se limpia la sesión local
    }
    limpiar();
  };

  return (
    <AuthContext.Provider value={{ usuario: sesion?.usuario ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);