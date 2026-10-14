import { useState } from 'react';
import { query } from '../api';
import { Dialog, Empty, ErrorNotice, Field, Icon, Loading, Pager, useRemote } from '../components';
function MemberDetail({ api, id, onClose }) {
  const state = useRemote(api, `/members/${id}`);
  return <Dialog title="Detalle del socio" onClose={onClose}><ErrorNotice error={state.error}/>{state.loading ? <Loading/> : state.data && <><div className="member-heading"><span className="avatar">{state.data.full_name.slice(0, 1)}</span><div><h3>{state.data.full_name}</h3><p className="muted">Documento {state.data.document_number}</p></div></div><div className="summary-box"><strong>{state.data.active_loans}</strong><span>libros pendientes de devolución</span></div><p className="muted">Cada socio puede tener hasta 3 libros sin devolver. Los vencidos también cuentan.</p></>}</Dialog>;
}
export default function Members({ api, revision, refresh }) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [modal, setModal] = useState(null);
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  const state = useRemote(api, `/members?${query({ q: search, page })}`, revision);
  async function create(event) {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setError(null);
    try { await api.request('/members', { method: 'POST', body }); setModal(null); refresh(); } catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <><div className="section-heading"><div><p className="eyebrow">NUESTRA COMUNIDAD</p><h1>Socios</h1><p className="muted">Las personas que dan vida a la biblioteca.</p></div><button className="button primary" onClick={() => { setError(null); setModal('new'); }}><Icon name="plus"/>Registrar socio</button></div>
    <form className="toolbar" onSubmit={event => { event.preventDefault(); setSearch(new FormData(event.currentTarget).get('q')); setPage(1); }}><div className="search-field"><Icon name="search"/><input aria-label="Buscar socios" name="q" type="search" placeholder="Buscar por nombre o documento…"/></div><button className="button quiet">Buscar</button></form>
    <ErrorNotice error={state.error}/>{state.loading && <Loading/>}
    {state.data?.items.length ? <div className="table-wrap"><table><thead><tr><th>Socio</th><th>Documento</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{state.data.items.map(member => <tr key={member.id}><td><div className="person"><span className="avatar small">{member.full_name.slice(0, 1)}</span><strong>{member.full_name}</strong></div></td><td className="tabular">{member.document_number}</td><td><button className="button quiet" onClick={() => setModal(member.id)}>Ver detalle <Icon name="arrow" size={16}/></button></td></tr>)}</tbody></table></div> : !state.loading && <Empty icon="users" title="Conoce a tus lectores" text="Registra un socio o ajusta la búsqueda para encontrarlo."/>}
    <Pager data={state.data} page={page} onPage={setPage} busy={state.loading}/>
    {modal === 'new' && <Dialog title="Registrar socio" onClose={() => setModal(null)}><form onSubmit={create}><ErrorNotice error={error}/><Field label="Nombre completo"><input name="full_name" maxLength={200} required autoFocus/></Field><Field label="Número de documento"><input name="document_number" maxLength={30} required/></Field><div className="dialog-actions"><button className="button quiet" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar socio'}</button></div></form></Dialog>}
    {modal && modal !== 'new' && <MemberDetail api={api} id={modal} onClose={() => setModal(null)}/>}
  </>;
}
