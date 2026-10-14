export class ApiError extends Error {
  constructor(message, status, code, details = []) { super(message); this.status = status; this.code = code; this.details = details; }
}
export function createApi(token, onExpired = () => {}) {
  async function request(path, { method = 'GET', body, signal, binary = false } = {}) {
    const headers = { Accept: binary ? 'image/png,image/jpeg' : 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const form = body instanceof FormData;
    if (body !== undefined && !form) headers['Content-Type'] = 'application/json';
    let response;
    try { response = await fetch(`/api/v1${path}`, { method, headers, signal, body: body === undefined ? undefined : form ? body : JSON.stringify(body) }); }
    catch (error) { if (error.name === 'AbortError') throw error; throw new ApiError('No se pudo conectar. Comprueba la conexión e inténtalo de nuevo.', 0, 'NETWORK_ERROR'); }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'No se pudo completar la operación.', code: 'HTTP_ERROR', details: [] }));
      if (response.status === 401 && token) onExpired();
      throw new ApiError(error.message, response.status, error.code, error.details);
    }
    if (response.status === 204) return null;
    return binary ? response.blob() : response.json();
  }
  return { request };
}
export function query(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== '' && value != null) params.set(key, String(value)); });
  return params.toString();
}
export const dateText = value => value ? new Date(value).toLocaleString('es-CO', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const today = () => new Date().toISOString().slice(0, 10);
