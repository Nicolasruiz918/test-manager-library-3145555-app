import { useState } from 'react';
import { query, today } from '../api';
import { Empty, ErrorNotice, Field, Loading, useRemote } from '../components';
export default function Reports({ api, revision }) {
  const date = today(); const [range, setRange] = useState({ from: `${date.slice(0, 7)}-01`, to: date });
  const state = useRemote(api, `/reports/most-borrowed?${query(range)}`, revision);
  const maximum = Math.max(1, ...((state.data?.rows ?? []).map(row => row.times_borrowed)));
  return <><div className="section-heading"><div><p className="eyebrow">UNA MIRADA A LA COLECCIÓN</p><h1>Los más prestados</h1><p className="muted">Conoce qué libros circulan más durante cada periodo.</p></div></div>
    <form className="toolbar loan-filters" onSubmit={event => { event.preventDefault(); setRange(Object.fromEntries(new FormData(event.currentTarget))); }}><Field label="Desde"><input name="from" type="date" required defaultValue={range.from}/></Field><Field label="Hasta"><input name="to" type="date" required defaultValue={range.to}/></Field><button className="button primary">Consultar reporte</button></form>
    <ErrorNotice error={state.error}/>{state.loading && <Loading/>}
    {state.data?.rows.length ? <><div className="report-summary"><strong>{state.data.rows.reduce((sum, row) => sum + row.times_borrowed, 0)}</strong><span>ejemplares prestados en el periodo</span></div><div className="table-wrap"><table><thead><tr><th>Posición</th><th>Libro</th><th>Categoría</th><th>Veces prestado</th></tr></thead><tbody>{state.data.rows.map((row, index) => <tr key={JSON.stringify([row.book_id, row.book_title, row.category_name])}><td><span className="rank">{String(index + 1).padStart(2, '0')}</span></td><td><strong>{row.book_title}</strong></td><td>{row.category_name}</td><td><div className="report-bar"><span style={{ width: `${100 * row.times_borrowed / maximum}%` }}/><strong>{row.times_borrowed}</strong></div></td></tr>)}</tbody></table></div></> : !state.loading && <Empty icon="chart" title="Sin préstamos en este periodo" text="Selecciona otro rango de fechas para consultar el historial."/>}
    <p className="fine">El reporte conserva el título y la categoría registrados al prestar. Las fechas incluyen ambos días, en UTC.</p>
  </>;
}
