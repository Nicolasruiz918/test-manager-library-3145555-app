import { useState } from 'react';
import { ErrorNotice, Field, Icon } from '../components';
export default function Users({ api }) {
  const [error, setError] = useState(null); const [success, setSuccess] = useState(null); const [busy, setBusy] = useState(false);
  async function create(event) {
    event.preventDefault(); const form = event.currentTarget; const body = { ...Object.fromEntries(new FormData(form)), role: 'librarian' };
    setBusy(true); setError(null); setSuccess(null);
    try { const user = await api.request('/users', { method: 'POST', body }); setSuccess(user.username); form.reset(); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <><div className="section-heading"><div><p className="eyebrow">EQUIPO DE LA BIBLIOTECA</p><h1>Registrar bibliotecario</h1><p className="muted">Da acceso a quienes acompañan a tus lectores.</p></div></div><div className="form-panel"><span className="empty-icon"><Icon name="shield" size={28}/></span><h2>Una nueva cuenta para el equipo</h2><p className="muted">Podrá consultar el catálogo, gestionar socios, registrar préstamos y devoluciones y revisar los vencidos.</p><form onSubmit={create}><ErrorNotice error={error}/>{success && <div className="notice success" role="status">La cuenta «{success}» fue creada como bibliotecario.</div>}<Field label="Nombre de usuario" hint="Se guarda sin espacios en los extremos y en minúsculas."><input name="username" autoComplete="off" required maxLength={120}/></Field><Field label="Contraseña"><input name="password" type="password" autoComplete="new-password" required/></Field><button className="button primary" disabled={busy}>{busy ? 'Creando…' : 'Crear bibliotecario'}</button></form></div></>;
}
