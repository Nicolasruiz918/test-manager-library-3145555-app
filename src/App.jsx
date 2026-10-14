import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApi } from './api';
import { ErrorNotice, Field, Icon, useRemote } from './components';
import Catalog from './features/Catalog';
import Members from './features/Members';
import Loans from './features/Loans';
import Overdue from './features/Overdue';
import Reports from './features/Reports';
import Users from './features/Users';
const navigation = [['catalog','book','Catálogo'],['members','users','Socios'],['loans','loan','Préstamos'],['overdue','clock','Vencidos'],['reports','chart','Reportes'],['users','shield','Bibliotecarios']];
function Login({ onLogin, notice }) {
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setError(null);
    try { const data = await createApi(null).request('/auth/login', { method: 'POST', body }); onLogin({ ...data, username: body.username.trim().toLowerCase(), expiresAt: Date.now() + data.expires_in * 1000 }); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <div className="login-layout"><section className="login-story"><div className="brand light"><span className="brand-mark"><Icon name="book" size={27}/></span><span>Manager<br/><strong>Library</strong></span></div><div className="story-content"><p className="eyebrow">UN ESPACIO PARA CADA HISTORIA</p><h1>Los libros nos acercan.<br/><em>Cuidemos su camino.</em></h1><p>Tu colección, tus lectores y cada préstamo, reunidos en un lugar.</p><div className="shelf-art" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div></div><span className="login-foot">GESTIÓN DE BIBLIOTECA · MANAGER LIBRARY</span></section>
    <main className="login-main"><div className="login-form"><span className="eyebrow">BIENVENIDO DE NUEVO</span><h2>Tu biblioteca te espera</h2><p className="muted">Inicia sesión con tu cuenta del equipo.</p>{notice && <div className="notice" role="status">{notice}</div>}<form onSubmit={submit}><ErrorNotice error={error}/><Field label="Nombre de usuario"><input name="username" autoComplete="username" required autoFocus placeholder="Tu usuario"/></Field><Field label="Contraseña"><input name="password" type="password" autoComplete="current-password" required placeholder="Tu contraseña"/></Field><button className="button primary login-submit" disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}<Icon name="arrow"/></button></form><p className="login-help"><Icon name="shield" size={16}/> Acceso exclusivo para el equipo de la biblioteca.</p></div></main></div>;
}
export default function App() {
  const [session, setSession] = useState(null); const [notice, setNotice] = useState(''); const [view, setView] = useState('catalog'); const [revision, setRevision] = useState(0);
  const logout = useCallback((expired = false) => { setSession(null); setView('catalog'); setNotice(expired ? 'Tu sesión venció. Inicia sesión de nuevo.' : 'Cerraste sesión correctamente.'); }, []);
  const api = useMemo(() => createApi(session?.access_token, () => logout(true)), [session?.access_token, logout]);
  useEffect(() => { if (!session) return; const timer = setTimeout(() => logout(true), Math.max(0, session.expiresAt - Date.now())); return () => clearTimeout(timer); }, [session, logout]);
  const categories = useRemote(api, session ? '/categories' : null);
  const overdue = useRemote(api, session ? '/loans/overdue?size=1' : null, revision);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  if (!session) return <Login notice={notice} onLogin={value => { setNotice(''); setSession(value); }}/>;
  const admin = session.role === 'admin';
  const props = { api, admin, revision, refresh, categories: categories.data?.items ?? [] };
  const screens = { catalog: Catalog, members: Members, loans: Loans, overdue: Overdue, reports: Reports, users: Users };
  const Screen = screens[view] ?? Catalog;
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Icon name="book" size={27}/></span><span>Manager<br/><strong>Library</strong></span></div><div className="nav-caption">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{navigation.filter(([key]) => admin || !['reports','users'].includes(key)).map(([key, icon, label]) => <button key={key} className={view === key ? 'nav-item active' : 'nav-item'} aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}><Icon name={icon}/><span>{label}</span>{key === 'overdue' && overdue.data?.total > 0 && <span className="nav-count">{overdue.data.total}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="side-note"><Icon name="book" size={24}/><p>Una biblioteca viva<br/><strong>empieza con su gente.</strong></p></div><button className="nav-item logout" onClick={() => logout(false)}><Icon name="exit"/><span>Cerrar sesión</span></button></div></aside>
    <div className="main-shell"><header className="topbar"><div><span className="breadcrumb">Biblioteca</span><span className="breadcrumb-divider">/</span><strong>{navigation.find(([key]) => key === view)?.[2]}</strong></div><div className="profile"><span className="profile-text"><strong>{session.username}</strong><small>{admin ? 'Administrador' : 'Bibliotecario'}</small></span><span className="avatar">{session.username.slice(0, 1).toUpperCase()}</span></div></header><main className="workspace" id="main-content"><ErrorNotice error={categories.error}/><Screen key={view} {...props}/></main><footer className="app-footer"><span>Manager Library</span><span>Historias que siguen su camino.</span></footer></div>
  </div>;
}
