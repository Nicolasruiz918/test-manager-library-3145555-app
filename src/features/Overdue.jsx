import { useState } from 'react';
import { dateText, query } from '../api';
import { Empty, ErrorNotice, Loading, Pager, useRemote } from '../components';
import { LoanDetail } from './Loans';
export default function Overdue({ api, revision, refresh }) {
  const [page, setPage] = useState(1); const [loan, setLoan] = useState(null);
  const state = useRemote(api, `/loans/overdue?${query({ page })}`, revision);
  return <><div className="section-heading"><div><p className="eyebrow">SEGUIMIENTO</p><h1>Libros vencidos</h1><p className="muted">Ejemplares pendientes, ordenados por mayor retraso.</p></div><span className="count-badge">{state.data?.total ?? '—'} pendientes</span></div>
    <ErrorNotice error={state.error}/>{state.loading && <Loading/>}
    {state.data?.items.length ? <div className="table-wrap"><table><thead><tr><th>Libro</th><th>Socio</th><th>Vencimiento · UTC</th><th>Retraso</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{state.data.items.map(item => <tr key={item.item_id}><td><strong>{item.book_title}</strong></td><td>{item.member_name}</td><td>{dateText(item.due_at)}</td><td><span className="status overdue">{item.days_late} días</span></td><td><button className="button quiet" onClick={() => setLoan(item.loan_id)}>Ver y devolver</button></td></tr>)}</tbody></table></div> : !state.loading && <Empty icon="clock" title="Todo está al día" text="No hay libros vencidos pendientes de devolución."/>}
    <Pager data={state.data} page={page} onPage={setPage} busy={state.loading}/><p className="fine">El retraso muestra días completos: menos de 24 horas se muestra como 0 días.</p>
    {loan && <LoanDetail api={api} id={loan} onClose={() => setLoan(null)} refresh={refresh}/>}
  </>;
}
