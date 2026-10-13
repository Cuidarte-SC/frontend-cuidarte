// Sesión del usuario (RF-1). Se guarda en sessionStorage: se borra al cerrar la pestaña.
// El token de acceso dura 15 min (NFR-SEG-9) y se renueva con el refresh token (RF-1.2);
// cuando el refresh vence o se revoca, la sesión se cierra sola.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setManejadoresSesion, setTokens } from './api';

const CLAVE = 'cuidarte_sesion';
const AuthContext = createContext(null);

const leerSesion = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLAVE));
    if (s?.token && s?.refresh_token) {
      setTokens(s.token, s.refresh_token);
      return s;
    }
  } catch {
    // sessionStorage no disponible o dato corrupto
  }
  return null;
};

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  const guardar = useCallback((datos) => {
    setTokens(datos.token, datos.refresh_token);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      // sin acción
    }
    setSesion(datos);
  }, []);

  const limpiar = useCallback(() => {
    setTokens(null, null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // sin acción
    }
    setSesion(null);
  }, []);

  useEffect(() => {
    setManejadoresSesion({ alExpirar: limpiar, alRenovar: guardar });
  }, [limpiar, guardar]);

  const login = async (nombreUsuario, password) => {
    const datos = await api('/auth/login', {
      method: 'POST',
      body: { nombre_usuario: nombreUsuario, password },
    });
    guardar(datos);
    return datos.usuario;
  };

  // RF-2.1: autoregistro (la cuenta se crea con rol paciente)
  const registrarse = (datos) => api('/auth/registro', { method: 'POST', body: datos });

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // aunque falle la red, se limpia la sesión local
    }
    limpiar();
  };

  return (
    <AuthContext.Provider value={{ usuario: sesion?.usuario ?? null, login, logout, registrarse }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);