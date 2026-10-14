import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { query } from './api';

export function Icon({ name = 'book', size = 20 }) {
  const paths = {
    book: <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15"/></>,
    users: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 4v3"/></>,
    loan: <><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    chart: <><path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/></>,
    shield: <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    exit: <><path d="M9 4H4v16h5M13 8l4 4-4 4M8 12h13"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.book}</svg>;
}
export function useRemote(api, path, revision = 0) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  useEffect(() => {
    if (!path) { setState({ data: null, loading: false, error: null }); return; }
    const controller = new AbortController();
    setState(previous => ({ ...previous, loading: true, error: null }));
    api.request(path, { signal: controller.signal }).then(data => setState({ data, loading: false, error: null })).catch(error => { if (error.name !== 'AbortError') setState({ data: null, loading: false, error }); });
    return () => controller.abort();
  }, [api, path, revision]);
  return state;
}
export function ErrorNotice({ error }) {
  if (!error) return null;
  return <div className="notice error" role="alert"><strong>{error.message ?? error}</strong>{error.details?.length > 0 && <ul>{error.details.map((detail, index) => <li key={index}>{detail.field}: {detail.issue}</li>)}</ul>}</div>;
}
export function Empty({ title = 'Todavía no hay resultados', text = 'Prueba con otra búsqueda o registra un nuevo elemento.', icon = 'book' }) {
  return <div className="empty"><span className="empty-icon"><Icon name={icon} size={32}/></span><h3>{title}</h3><p>{text}</p></div>;
}
export function Loading() { return <div className="loading" role="status"><span className="spinner"/> Cargando…</div>; }
export function Field({ label, children, hint }) {
  const generatedId = useId(); const id = children.props.id ?? generatedId;
  return <div className="field"><label htmlFor={id}>{label}</label>{cloneElement(children, { id, 'aria-describedby': hint ? id + '-hint' : undefined })}{hint && <small id={id + '-hint'}>{hint}</small>}</div>;
}
export function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null); const id = useId();
  useEffect(() => { ref.current.showModal(); return () => ref.current?.close(); }, []);
  return <dialog className={wide ? 'dialog wide' : 'dialog'} ref={ref} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="dialog-heading"><h2 id={id}>{title}</h2><button type="button" className="icon-button" aria-label="Cerrar ventana" onClick={onClose}><Icon name="close"/></button></div>{children}
  </dialog>;
}
export function Pager({ data, page, onPage, busy }) {
  if (!data) return null;
  const pages = Math.max(1, Math.ceil(data.total / data.size));
  return <div className="pager"><span>{data.total} resultado{data.total !== 1 ? 's' : ''} · Página {page} de {pages}</span><div><button className="button quiet" disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>Anterior</button><button className="button quiet" disabled={page >= pages || busy} onClick={() => onPage(page + 1)}>Siguiente</button></div></div>;
}
export function Status({ value }) { return <span className={`status ${value}`}>{({ open: 'Abierto', overdue: 'Vencido', closed: 'Cerrado' })[value] ?? value}</span>; }
export function Cover({ api, book, large = false }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    setUrl(null); if (!book.cover_key) return;
    let objectUrl; let active = true; const controller = new AbortController();
    api.request(`/books/${book.id}/cover`, { binary: true, signal: controller.signal }).then(blob => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } }).catch(() => {});
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [api, book.id, book.cover_key]);
  const tone = Number(book.isbn?.slice(-1) ?? 0) % 5;
  return <div className={`cover tone-${tone} ${large ? 'large' : ''}`}>{url ? <img src={url} alt={`Portada de ${book.title}`}/> : <div className="cover-art" aria-hidden="true"><span className="cover-rule"/><Icon size={large ? 46 : 34}/><span className="cover-caption">BIBLIOTECA</span><span className="cover-rule"/></div>}</div>;
}
export function SearchPicker({ api, kind, selected, onSelect, title, disabledIds = [] }) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const state = useRemote(api, `/${kind}?${query({ q: search, page, size: 8 })}`);
  return <div className="picker"><Field label={title}><input type="search" value={search} placeholder={kind === 'members' ? 'Nombre o documento' : 'Título o autor'} onChange={event => { setSearch(event.target.value); setPage(1); }}/></Field>
    {selected && <div className="selected-chip">{selected.full_name ?? selected.title}<button type="button" aria-label="Quitar selección" onClick={() => onSelect(null)}>×</button></div>}
    <ErrorNotice error={state.error}/>{state.loading && <Loading/>}
    <div className="picker-list">{state.data?.items.map(item => <button type="button" key={item.id} disabled={disabledIds.includes(item.id) || (kind === 'books' && item.available_copies === 0)} onClick={() => onSelect(item)}><span><strong>{item.full_name ?? item.title}</strong><small>{item.document_number ?? item.author}</small></span><span className="picker-meta">{kind === 'books' ? `${item.available_copies} disponibles` : 'Seleccionar'}</span></button>)}</div>
    {state.data?.total === 0 && <p className="muted">No se encontraron resultados.</p>}<Pager data={state.data} page={page} onPage={setPage} busy={state.loading}/>
  </div>;
}
