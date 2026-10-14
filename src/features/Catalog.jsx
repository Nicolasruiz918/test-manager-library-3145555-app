import { useState } from 'react';
import { query } from '../api';
import { Cover, Dialog, Empty, ErrorNotice, Field, Icon, Loading, Pager, useRemote } from '../components';

function BookForm({ api, book, categories, onClose, onSaved }) {
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); data.total_copies = Number(data.total_copies);
    setBusy(true); setError(null);
    try { await api.request(book ? `/books/${book.id}` : '/books', { method: book ? 'PUT' : 'POST', body: data }); onSaved(); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <Dialog title={book ? 'Editar libro' : 'Registrar libro'} onClose={onClose}><form onSubmit={submit}><ErrorNotice error={error}/>
    <Field label="Título"><input name="title" required maxLength={250} defaultValue={book?.title} autoFocus/></Field>
    <Field label="Autor"><input name="author" required maxLength={200} defaultValue={book?.author}/></Field>
    <Field label="ISBN" hint={book ? 'El ISBN se conserva después del registro.' : 'Escribe exactamente 13 dígitos.'}><input name={book ? undefined : 'isbn'} required pattern="[0-9]{13}" inputMode="numeric" readOnly={Boolean(book)} defaultValue={book?.isbn}/></Field>
    <div className="form-grid"><Field label="Categoría"><select name="category_id" required defaultValue={book?.category.id ?? ''}><option value="" disabled>Seleccionar</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
    <Field label="Ejemplares totales"><input name="total_copies" type="number" min="1" step="1" required defaultValue={book?.total_copies ?? 1}/></Field></div>
    {book && <p className="muted">{book.total_copies - book.available_copies} ejemplares pendientes de devolución.</p>}
    <div className="dialog-actions"><button type="button" className="button quiet" onClick={onClose}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar libro'}</button></div>
  </form></Dialog>;
}
function BookDetail({ api, initial, admin, onClose, onEdit, onDeleted, refresh }) {
  const [revision, setRevision] = useState(0); const state = useRemote(api, `/books/${initial.id}`, revision);
  const book = state.data ?? initial; const [error, setError] = useState(null); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  async function changeCover(event) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setError(null); const body = new FormData(); body.append('file', file);
    try { await api.request(`/books/${book.id}/cover`, { method: 'PUT', body }); setRevision(value => value + 1); refresh(); }
    catch (failure) { setError(failure); } finally { setBusy(false); event.target.value = ''; }
  }
  async function removeCover() {
    setBusy(true); setError(null);
    try { await api.request(`/books/${book.id}/cover`, { method: 'DELETE' }); setRevision(value => value + 1); refresh(); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError(null);
    try { await api.request(`/books/${book.id}`, { method: 'DELETE' }); onDeleted(); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <Dialog title="Detalle del libro" onClose={onClose} wide><ErrorNotice error={error ?? state.error}/><div className="book-detail"><Cover api={api} book={book} large/><div><span className="eyebrow">{book.category.name}</span><h3 className="book-detail-title">{book.title}</h3><p className="muted">{book.author}</p><dl className="facts"><div><dt>ISBN</dt><dd>{book.isbn}</dd></div><div><dt>Disponibles</dt><dd>{book.available_copies} de {book.total_copies}</dd></div></dl>
    {admin && <><div className="stack"><label className="button quiet file-button">Subir portada<input aria-label="Archivo de portada" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={changeCover}/></label>{book.cover_key && <button className="button quiet" disabled={busy} onClick={removeCover}>Quitar portada</button>}</div><p className="fine">JPG o PNG · Máximo 2 MB</p></>}
  </div></div>{admin && <div className="dialog-actions split"><button className="button danger" disabled={busy} onClick={() => setConfirm(true)}>Dar de baja</button><button className="button primary" onClick={() => onEdit(book)}>Editar libro</button></div>}
    {confirm && <div className="confirmation"><strong>¿Dar de baja «{book.title}»?</strong><p>Se retirará del catálogo y conservará su historial de préstamos.</p><div className="stack"><button className="button quiet" disabled={busy} onClick={() => setConfirm(false)}>Cancelar</button><button className="button danger solid" disabled={busy} onClick={remove}>Confirmar baja</button></div></div>}
  </Dialog>;
}
export default function Catalog({ api, admin, categories, revision, refresh }) {
  const [filters, setFilters] = useState({ q: '', category_id: '' }); const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); const state = useRemote(api, `/books?${query({ ...filters, page, size: 12 })}`, revision);
  function search(event) { event.preventDefault(); setFilters(Object.fromEntries(new FormData(event.currentTarget))); setPage(1); }
  function saved() { setModal(null); refresh(); }
  return <><div className="section-heading"><div><p className="eyebrow">LA COLECCIÓN</p><h1>Catálogo de libros</h1><p className="muted">Cada historia, en su lugar. Consulta y organiza tu colección.</p></div>{admin && <button className="button primary" onClick={() => setModal({ type: 'new' })}><Icon name="plus"/>Registrar libro</button>}</div>
    <form className="toolbar" onSubmit={search}><div className="search-field"><Icon name="search"/><input aria-label="Buscar libros" name="q" type="search" placeholder="Buscar por título o autor…"/></div><select name="category_id" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="button quiet">Buscar</button></form>
    <div className="results-heading"><span>{state.data?.total ?? '—'} libros en el catálogo</span><span>Ordenados por título</span></div>
    <ErrorNotice error={state.error}/>{state.loading && <Loading/>}
    {!state.loading && state.data?.items.length === 0 && <Empty title="Tu próxima lectura empieza aquí" text="No hay libros que coincidan. Ajusta la búsqueda o registra un libro."/>}
    <div className="book-grid">{state.data?.items.map(book => <article className="book-card" key={book.id}><button className="book-open" aria-label={`Ver ${book.title}`} onClick={() => setModal({ type: 'detail', book })}><Cover api={api} book={book}/></button><div className="book-card-body"><span className="category-label">{book.category.name}</span><button className="title-button" onClick={() => setModal({ type: 'detail', book })}>{book.title}</button><p className="book-author">{book.author || 'Autor no indicado'}</p><div className="book-card-footer"><span className={book.available_copies ? 'availability' : 'availability none'}><i/>{book.available_copies ? `${book.available_copies} disponibles` : 'Sin ejemplares'}</span><span className="fine">{book.total_copies} en total</span></div></div></article>)}</div>
    <Pager data={state.data} page={page} onPage={setPage} busy={state.loading}/>
    {modal?.type === 'new' && <BookForm api={api} categories={categories} onClose={() => setModal(null)} onSaved={saved}/>}
    {modal?.type === 'edit' && <BookForm api={api} book={modal.book} categories={categories} onClose={() => setModal(null)} onSaved={saved}/>}
    {modal?.type === 'detail' && <BookDetail api={api} initial={modal.book} admin={admin} onClose={() => setModal(null)} onEdit={book => setModal({ type: 'edit', book })} onDeleted={saved} refresh={refresh}/>}
  </>;
}
