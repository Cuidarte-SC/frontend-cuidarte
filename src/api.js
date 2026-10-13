// Cliente HTTP hacia la API de Cuidarte+ (RF-1).
// El token de acceso (JWT, 15 min) viaja en el header Authorization. Si vence, se renueva
// automáticamente una vez con el refresh token (RF-1.2) y se reintenta la petición.
const BASE = '/api';
const RUTAS_PUBLICAS = ['/auth/login', '/auth/registro', '/auth/refresh'];

let token = null;
let refreshToken = null;
let alExpirarSesion = () => {};
let alRenovarSesion = () => {};
let renovando = null;

export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export const setTokens = (acceso, refresh) => {
  token = acceso;
  refreshToken = refresh;
};

export const setManejadoresSesion = ({ alExpirar, alRenovar }) => {
  alExpirarSesion = alExpirar;
  alRenovarSesion = alRenovar;
};

// Una sola renovación a la vez, aunque varias peticiones fallen al mismo tiempo
const renovar = () => {
  if (!refreshToken) return Promise.resolve(false);
  if (!renovando) {
    renovando = (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const datos = await res.json();
        setTokens(datos.token, datos.refresh_token);
        alRenovarSesion(datos);
        return true;
      } catch {
        return false;
      } finally {
        renovando = null;
      }
    })();
  }
  return renovando;
};

const enviar = (ruta, { method, body, form }) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(BASE + ruta, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
};

export async function api(ruta, { method = 'GET', body, form } = {}) {
  let res = await enviar(ruta, { method, body, form });

  if (res.status === 401 && token && !RUTAS_PUBLICAS.includes(ruta)) {
    if (await renovar()) res = await enviar(ruta, { method, body, form });
    if (res.status === 401) alExpirarSesion(); // refresh vencido o revocado
  }
  if (res.status === 204) return null;

  const tipo = res.headers.get('content-type') || '';
  const datos = tipo.includes('application/json') ? await res.json() : await res.blob();

  if (!res.ok) {
    throw new ApiError(res.status, datos?.error || `Error ${res.status}`);
  }
  return datos;
}

// Descarga un documento protegido (requiere token) y lo guarda con su nombre original
export async function descargarDocumento(id, nombre) {
  const blob = await api(`/documentos/${id}/descarga`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}