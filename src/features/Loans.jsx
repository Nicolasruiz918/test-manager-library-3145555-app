import { useState } from 'react';
import { dateText, query } from '../api';
import { Dialog, Empty, ErrorNotice, Field, Icon, Loading, Pager, SearchPicker, Status, useRemote } from '../components';
export function LoanDetail({ api, id, onClose, refresh }) {
  const [revision, setRevision] = useState(0); const state = useRemote(api, `/loans/${id}`, revision); const [busy, setBusy] = useState(null); const [error, setError] = useState(null);
  async function returnItem(item) {
    setBusy(item.id); setError(null);
    try { await api.request(`/loans/${id}/items/${item.id}/return`, { method: 'POST' }); setRevision(value => value + 1); refresh(); }
    catch (failure) { setError(failure); } finally { setBusy(null); }
  }
  return <Dialog title="Detalle del préstamo" onClose={onClose} wide><ErrorNotice error={error ?? state.error}/>{state.loading && <Loading/>}{state.data && <><div className="loan-summary"><div><span className="fine">Registrado · UTC</span><strong>{dateText(state.data.loaned_at)}</strong></div><Status value={state.data.status}/></div><div className="loan-items">{state.data.items.map(item => <article key={item.id}><div className="loan-item-icon"><Icon name="book"/></div><div className="grow"><strong>{item.book_title}</strong><p className="fine">{item.category_name} · ISBN {item.isbn}</p><p className="muted">{item.returned_at ? `Devuelto: ${dateText(item.returned_at)} UTC` : `Vence: ${dateText(item.due_at)} UTC`}</p></div>{item.returned_at ? <span className="status closed">Devuelto</span> : <button className="button primary" disabled={Boolean(busy)} onClick={() => returnItem(item)}>{busy === item.id ? 'Registrando…' : 'Devolver'}</button>}</article>)}</div><p className="fine">Las devoluciones se registran por ejemplar y no se pueden deshacer.</p></>}</Dialog>;
}
function LendDialog({ api, onClose, onSaved }) {
  const [member, setMember] = useState(null); const [books, setBooks] = useState([]); const [busy, setBusy] = useState(false); const [error, setError] = useState(null);
  const detail = useRemote(api, member ? `/members/${member.id}` : null);
  async function lend() {
    setBusy(true); setError(null);
    try { const loan = await api.request('/loans', { method: 'POST', body: { member_id: member.id, items: books.map(book => ({ book_id: book.id })) } }); onSaved(loan); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <Dialog title="Registrar préstamo" onClose={onClose} wide><p className="muted">Selecciona un socio y de 1 a 3 libros distintos. El plazo es de 14 días.</p><ErrorNotice error={error}/><div className="lending-grid"><div><SearchPicker api={api} kind="members" selected={member} onSelect={value => { setMember(value); setError(null); }} title="Buscar socio"/>{detail.data && <p className="selection-note">{detail.data.active_loans} de 3 libros pendientes de devolución</p>}</div><div><SearchPicker api={api} kind="books" title="Buscar libros" disabledIds={books.map(book => book.id)} onSelect={book => { if (book && books.length < 3) setBooks(previous => [...previous, book]); }}/><div className="selected-books"><span className="fine">SELECCIONADOS · {books.length}/3</span>{books.map(book => <div className="selected-chip" key={book.id}><span>{book.title}</span><button type="button" aria-label={`Quitar ${book.title}`} onClick={() => setBooks(previous => previous.filter(item => item.id !== book.id))}>×</button></div>)}</div></div></div><div className="dialog-actions"><button className="button quiet" onClick={onClose}>Cancelar</button><button className="button primary" disabled={busy || !member || books.length === 0} onClick={lend}>{busy ? 'Registrando…' : 'Confirmar préstamo'}</button></div></Dialog>;
}
export default function Loans({ api, revision, refresh }) {
  const [filters, setFilters] = useState({}); const [page, setPage] = useState(1); const [modal, setModal] = useState(null); const [member, setMember] = useState(null); const [showMember, setShowMember] = useState(false);
  const state = useRemote(api, `/loans?${query({ ...filters, page })}`, revision);
  function apply(event) { event.preventDefault(); setFilters({ ...Object.fromEntries(new FormData(event.currentTarget)), member_id: member?.id ?? '' }); setPage(1); }
  return <><div className="section-heading"><div><p className="eyebrow">LIBROS EN MOVIMIENTO</p><h1>Préstamos y devoluciones</h1><p className="muted">Sigue cada préstamo, desde la entrega hasta su regreso.</p></div><button className="button primary" onClick={() => setModal('new')}><Icon name="plus"/>Nuevo préstamo</button></div>
    <form className="toolbar loan-filters" onSubmit={apply}><Field label="Desde"><input name="from" type="date"/></Field><Field label="Hasta"><input name="to" type="date"/></Field><Field label="Estado"><select name="status"><option value="">Todos</option><option value="open">Abiertos</option><option value="overdue">Vencidos</option><option value="closed">Cerrados</option></select></Field><button type="button" className="button quiet" onClick={() => setShowMember(value => !value)}>{member ? member.full_name : 'Todos los socios'}</button><button className="button quiet">Filtrar</button></form>
    {showMember && <div className="filter-picker"><SearchPicker api={api} kind="members" title="Filtrar por socio" selected={member} onSelect={value => { setMember(value); setShowMember(false); setFilters(previous => ({ ...previous, member_id: value?.id ?? '' })); setPage(1); }}/>{member && <button className="button quiet" onClick={() => { setMember(null); setFilters(previous => ({ ...previous, member_id: '' })); setShowMember(false); }}>Quitar filtro de socio</button>}</div>}
    <ErrorNotice error={state.error}/>{state.loading && <Loading/>}
    {state.data?.items.length ? <div className="table-wrap"><table><thead><tr><th>Préstamo</th><th>Registro · UTC</th><th>Libros</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{state.data.items.map(loan => <tr key={loan.id}><td><strong>#{loan.id.slice(0, 8)}</strong></td><td>{dateText(loan.loaned_at)}</td><td><span className="loan-titles">{loan.items.map(item => item.book_title).join(', ')}</span></td><td><Status value={loan.status}/></td><td><button className="button quiet" onClick={() => setModal(loan.id)}>Ver préstamo <Icon name="arrow" size={16}/></button></td></tr>)}</tbody></table></div> : !state.loading && <Empty icon="loan" title="No hay préstamos para estos filtros" text="Registra un préstamo o consulta otro periodo."/>}
    <Pager data={state.data} page={page} onPage={setPage} busy={state.loading}/><p className="fine">Las fechas se muestran en UTC. Los límites del periodo incluyen ambos días.</p>
    {modal === 'new' && <LendDialog api={api} onClose={() => setModal(null)} onSaved={loan => { refresh(); setModal(loan.id); }}/>}
    {modal && modal !== 'new' && <LoanDetail api={api} id={modal} onClose={() => setModal(null)} refresh={refresh}/>}
  </>;
}
