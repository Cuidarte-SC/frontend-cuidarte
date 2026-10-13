// Cliente HTTP hacia la API de Cuidarte+. El token JWT viaja en el header Authorization.
const BASE = '/api';

let token = null;
let alExpirarSesion = () => {};

export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export const setToken = (nuevo) => {
  token = nuevo;
};

export const setAlExpirarSesion = (fn) => {
  alExpirarSesion = fn;
};

export async function api(ruta, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + ruta, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  // Token vencido o revocado: se cierra la sesión local
  if (res.status === 401 && token) alExpirarSesion();
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