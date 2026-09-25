import { Fragment, useEffect, useState } from 'react';
import {
  getClientes,
  getAduanas, postAduana, getManifiestos,
  getCombustibles, getDocumentos, putCombustible, ignorarTarifa,
  ejecutarManifiestos, ejecutarCombustibles,
  getTipoCambio, actualizarTipoCambio, sincronizarTipoCambioCombustibles,
  getReferencias, postReferencia,
  getPrecioMarcador, previewPrecioMarcador, procesarPrecioMarcador, rellenarPrecioMarcador, aplicarPrecioMarcador,
  login, logout, getMe, getUsuarios, postUsuario, putUsuario,
} from './api.js';
import DashboardSection from './DashboardSection.jsx';

function useData(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading };
}

function AduanasSection() {
  const [refresh, setRefresh] = useState(0);
  const aduanas = useData(getAduanas, [refresh]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function agregar(e) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await postAduana(codigo.trim(), nombre.trim());
      setCodigo('');
      setNombre('');
      setRefresh((r) => r + 1);
      setMsg('Aduana agregada.');
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card">
      <h2>Aduanas</h2>
      <form onSubmit={agregar} className="inline-form">
        <input placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <button type="submit">Agregar</button>
      </form>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {aduanas.error && <p className="error">{aduanas.error}</p>}
      {aduanas.data && aduanas.data.length > 0 && (
        <table>
          <thead><tr><th>Código</th><th>Nombre</th></tr></thead>
          <tbody>
            {aduanas.data.map((a) => (
              <tr key={a.codigo_aduana}><td>{a.codigo_aduana}</td><td>{a.nombre}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ManifiestosSection({ canWrite }) {
  const clientes = useData(getClientes);
  const [nit, setNit] = useState('');
  const manifiestos = useData(() => (nit ? getManifiestos(nit) : Promise.resolve([])), [nit]);
  const [runMsg, setRunMsg] = useState(null);
  const [running, setRunning] = useState(false);

  async function procesar() {
    setRunning(true);
    setRunMsg(null);
    try {
      const r = await ejecutarManifiestos();
      setRunMsg(`Terminado: ${r.total ?? 0} manifiestos, ${r.nuevos ?? 0} nuevos, ${r.errores ?? 0} errores.`);
    } catch (e) {
      setRunMsg(`Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card">
      <h2>Manifiestos</h2>
      {canWrite && (
        <div className="toolbar">
          <button className="btn" onClick={procesar} disabled={running}>{running ? 'Procesando…' : 'Procesar Manifiestos'}</button>
          {runMsg && <span className="run-msg">{runMsg}</span>}
        </div>
      )}
      <select value={nit} onChange={(e) => setNit(e.target.value)}>
        <option value="">Seleccione un cliente…</option>
        {(clientes.data || []).map((c) => (
          <option key={c.nit} value={c.nit}>{c.nombre} ({c.nit})</option>
        ))}
      </select>
      {nit && manifiestos.loading && <p className="empty">Cargando…</p>}
      {nit && manifiestos.error && <p className="error">{manifiestos.error}</p>}
      {nit && manifiestos.data && manifiestos.data.length === 0 && <p className="empty">Sin manifiestos descargados.</p>}
      {nit && manifiestos.data && manifiestos.data.length > 0 && (
        <table>
          <thead>
            <tr><th>Manifiesto</th><th>Fecha</th><th>Aduana</th><th>Archivo</th><th></th></tr>
          </thead>
          <tbody>
            {manifiestos.data.map((m) => (
              <tr key={m.id}>
                <td>{m.num_man}</td>
                <td>{m.fecha ? m.fecha.slice(0, 10) : ''}</td>
                <td>{m.aduana}</td>
                <td>{m.nombre_archivo}</td>
                <td><a href={`/api/manifiestos/${m.id}/archivo`} target="_blank" rel="noreferrer">Abrir PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const COLUMNAS_COMBUSTIBLES = [
  'dim_dam', 'crt', 'uso', 'fecha', 'aduana', 'incoterm', 'producto', 'proveedor',
  'importador', 'transporte', 'cantidad_m3', 'tipo_cambio_dim', 'tramo_flete',
  'us_unitario', 'importador_nit', 'pais_procedencia',
  'modalidad_despacho', 'us_precio_marcador', 'fecha_factura_trans', 'flete_total_usd',
  'flete_total_bs', 'tipo_cambio_trans', 'tarifa_flete_usd_m3',
];

const CAMPOS_EDITABLES = COLUMNAS_COMBUSTIBLES.filter((col) => col !== 'dim_dam');

const CAMPOS_NUMERICOS = new Set([
  'cantidad_m3', 'tipo_cambio_dim', 'us_unitario', 'us_precio_marcador',
  'flete_total_usd', 'flete_total_bs', 'tipo_cambio_trans',
  'tarifa_flete_usd_m3', 'tarifa_flete_bob_m3',
]);

const CAMPOS_FECHA = new Set(['fecha', 'fecha_factura_trans']);

function toFechaStr(v) {
  if (!v) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function mismoValor(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

function tarifaAlta(c) {
  if (c.tarifa_flete_usd_m3 == null) return true;
  return Number(c.tarifa_flete_usd_m3) > 150;
}

function tarifaRevisadaOk(c) {
  return Boolean(c.tarifa_revisada) && mismoValor(c.tarifa_revisada_valor, c.tarifa_flete_usd_m3);
}

function usUnitarioAlto(c) {
  return c.us_unitario != null && Number(c.us_unitario) > 5000;
}

function filaClase(c) {
  if (c.tipo_cambio_trans == null) return 'soft-red';
  if (usUnitarioAlto(c)) return 'soft-violet';
  if (tarifaAlta(c) && !tarifaRevisadaOk(c)) return 'soft-yellow';
  return '';
}

function DocsRow({ id }) {
  const docs = useData(() => getDocumentos(id), [id]);
  if (docs.loading) return <p className="empty">Cargando…</p>;
  if (docs.error) return <p className="error">{docs.error}</p>;
  if (!docs.data || docs.data.length === 0) return <p className="empty">Sin documentos.</p>;
  return (
    <div className="comb-docs">
      <h3>Documentos</h3>
      <table>
        <thead><tr><th>Tipo</th><th>Número</th><th>Emisor</th><th></th></tr></thead>
        <tbody>
          {docs.data.map((d) => (
            <tr key={d.id}>
              <td>{d.tipo_des || d.tipo}</td>
              <td>{d.num}</td>
              <td>{d.emi}</td>
              <td><a href={`/api/combustibles/${id}/documentos/${d.id}/archivo`} target="_blank" rel="noreferrer">Descargar</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CombustiblesSection({ canWrite }) {
  const clientes = useData(getClientes);
  const [nit, setNit] = useState('');
  const [tab, setTab] = useState('historial');
  const [pagina, setPagina] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [mes, setMes] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const comb = useData(() => getCombustibles(nit, pagina, tab, mesFiltro), [nit, pagina, tab, mesFiltro, refresh]);
  const [runMsg, setRunMsg] = useState(null);
  const [running, setRunning] = useState(false);
  const [docsId, setDocsId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [editErr, setEditErr] = useState(null);

  const data = comb.data;
  const filas = data && data.filas ? data.filas : [];
  const total = data ? data.total : 0;
  const limite = data ? data.limite : 100;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const totalHistorial = data ? data.totalHistorial : 0;
  const totalPendientes = data ? data.totalPendientes : 0;

  useEffect(() => {
    if (data && pagina > totalPaginas) setPagina(totalPaginas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function cambiarTab(t) {
    setTab(t);
    setPagina(1);
    setDocsId(null);
    setEditId(null);
  }

  function cambiarNit(v) {
    setNit(v);
    setPagina(1);
  }

  function refrescarMes() {
    setMesFiltro(mes);
    setPagina(1);
    setRefresh((n) => n + 1);
  }

  async function procesar() {
    setRunning(true);
    setRunMsg(null);
    try {
      const r = await ejecutarCombustibles();
      setRunMsg(`Terminado: ${r.total ?? 0} declaraciones, ${r.nuevos ?? 0} nuevos, ${r.errores ?? 0} errores.`);
      setRefresh((n) => n + 1);
    } catch (e) {
      setRunMsg(`Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  async function sincronizarTc() {
    setRunning(true);
    setRunMsg(null);
    try {
      const r = await sincronizarTipoCambioCombustibles();
      setRunMsg(`Tipo de cambio sincronizado: ${r.actualizados} registros, ${r.cotizaciones} cotizaciones nuevas${r.sinCotizacion ? `, ${r.sinCotizacion} sin cotización` : ''}.`);
      setRefresh((n) => n + 1);
    } catch (e) {
      setRunMsg(`Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  function toggleDocs(id) {
    setDocsId((cur) => (cur === id ? null : id));
  }

  function editar(c) {
    const init = {};
    for (const col of CAMPOS_EDITABLES) {
      const v = c[col];
      if (CAMPOS_FECHA.has(col)) init[col] = toFechaStr(v);
      else init[col] = v == null ? '' : String(v);
    }
    setForm(init);
    setEditId(c.id);
    setEditErr(null);
  }

  function setCampo(col, valor) {
    setForm((f) => ({ ...f, [col]: valor }));
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    setEditErr(null);
    try {
      await putCombustible(editId, form);
      setEditId(null);
      setForm({});
      setRefresh((n) => n + 1);
    } catch (ex) {
      setEditErr(ex.message);
    }
  }

  async function ignorar(c) {
    try {
      await ignorarTarifa(c.id);
      setRefresh((n) => n + 1);
    } catch (ex) {
      setEditErr(ex.message);
    }
  }

  return (
    <div className="card">
      <h2>Combustibles</h2>
      <div className="toolbar">
        <select value={nit} onChange={(e) => cambiarNit(e.target.value)}>
          <option value="">Todos los clientes</option>
          {(clientes.data || []).map((c) => (
            <option key={c.nit} value={c.nit}>{c.nombre} ({c.nit})</option>
          ))}
        </select>
        {canWrite && <button className="btn" onClick={procesar} disabled={running}>{running ? 'Procesando…' : 'Procesar Combustibles'}</button>}
        {canWrite && <button className="btn" onClick={sincronizarTc} disabled={running}>Sincronizar T/C</button>}
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        <button className="btn" onClick={refrescarMes} disabled={running}>Refrescar</button>
        <a className="btn" href={`/api/combustibles/export${mes ? `?mes=${mes}` : ''}`}>Descargar Excel</a>
      </div>
      {runMsg && <p className="ok">{runMsg}</p>}
      {editErr && <p className="error">{editErr}</p>}

      <div className="tabs">
        <button className={tab === 'historial' ? 'active' : ''} onClick={() => cambiarTab('historial')}>Historial ({totalHistorial})</button>
        <button className={tab === 'pendientes' ? 'active' : ''} onClick={() => cambiarTab('pendientes')}>Pendientes ({totalPendientes})</button>
      </div>

      <div className="comb-legend">
        <span><i className="lg lg-red" /> Dato faltante (T/C nulo)</span>
        <span><i className="lg lg-violet" /> us_unitario &gt; 5000</span>
        <span><i className="lg lg-yellow" /> Tarifa sin revisar</span>
      </div>

      {comb.loading && <p className="empty">Cargando…</p>}
      {comb.error && <p className="error">{comb.error}</p>}
      {!comb.loading && !comb.error && filas.length === 0 && (
        <p className="empty">{tab === 'pendientes' ? 'Sin pendientes.' : 'Sin datos extraídos.'}</p>
      )}
      {filas.length > 0 && (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {COLUMNAS_COMBUSTIBLES.map((col) => <th key={col}>{col}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((c) => {
                  const mostrandoDocs = docsId === c.id;
                  const editando = editId === c.id;
                  return (
                    <Fragment key={c.id}>
                      <tr className={filaClase(c)}>
                        {COLUMNAS_COMBUSTIBLES.map((col) => {
                          let v = c[col];
                          if (col === 'fecha' || col === 'fecha_factura_trans') {
                            v = toFechaStr(c[col]);
                          } else if (col === 'tipo_cambio_trans' && v == null) {
                            v = '-';
                          } else if (v == null) {
                            v = '';
                          }
                          return <td key={col}>{v}</td>;
                        })}
                        <td>
                          <button className="link" onClick={() => toggleDocs(c.id)}>Docs</button>{' '}
                          {canWrite && <button className="link" onClick={() => editar(c)}>Editar</button>}{' '}
                          {canWrite && tarifaAlta(c) && !tarifaRevisadaOk(c) && (
                            <button className="link" onClick={() => ignorar(c)}>Ignorar</button>
                          )}
                        </td>
                      </tr>
                      {mostrandoDocs && (
                        <tr className="comb-expand">
                          <td colSpan={COLUMNAS_COMBUSTIBLES.length + 2}>
                            <DocsRow id={c.id} />
                          </td>
                        </tr>
                      )}
                      {editando && (
                        <tr className="comb-expand">
                          <td colSpan={COLUMNAS_COMBUSTIBLES.length + 2}>
                            <form onSubmit={guardarEdicion}>
                              <div className="comb-edit-grid">
                                {CAMPOS_EDITABLES.map((col) => {
                                  const tipo = CAMPOS_FECHA.has(col) ? 'date'
                                    : CAMPOS_NUMERICOS.has(col) ? 'number' : 'text';
                                  return (
                                    <label key={col} className="comb-edit-field">
                                      <span>{col}</span>
                                      <input
                                        type={tipo}
                                        step={tipo === 'number' ? 'any' : undefined}
                                        value={form[col] ?? ''}
                                        onChange={(e) => setCampo(col, e.target.value)}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                              <div className="comb-edit-actions">
                                <button type="submit" className="btn">Guardar</button>
                                <button type="button" className="link" onClick={() => setEditId(null)}>Cancelar</button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button type="button" className="pg" onClick={() => setPagina(1)} disabled={pagina <= 1}>«</button>
            <button type="button" className="pg" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>‹</button>
            <span>Página {pagina} de {totalPaginas} &middot; {total} registros</span>
            <button type="button" className="pg" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas}>›</button>
            <button type="button" className="pg" onClick={() => setPagina(totalPaginas)} disabled={pagina >= totalPaginas}>»</button>
          </div>
        </>
      )}
    </div>
  );
}

function TipoCambioSection({ canWrite }) {
  const [refresh, setRefresh] = useState(0);
  const tc = useData(getTipoCambio, [refresh]);
  const [desde, setDesde] = useState('2026-06-01');
  const [hasta, setHasta] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function actualizar() {
    setMsg(null);
    setErr(null);
    try {
      const r = await actualizarTipoCambio(desde, hasta);
      setMsg(`Actualizado: ${r.actualizados} días, ${r.sinCotizacion} sin cotización, ${r.errores} errores.`);
      setRefresh((n) => n + 1);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="card">
      <h2>Tipo de cambio (BCB)</h2>
      {canWrite && (
        <div className="toolbar">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className="btn" onClick={actualizar}>Actualizar</button>
        </div>
      )}
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {tc.loading && <p className="empty">Cargando…</p>}
      {tc.error && <p className="error">{tc.error}</p>}
      {tc.data && tc.data.length === 0 && <p className="empty">Sin datos.</p>}
      {tc.data && tc.data.length > 0 && (
        <table>
          <thead><tr><th>Fecha</th><th>Valor (Bs/USD)</th><th>Fuente</th></tr></thead>
          <tbody>
            {tc.data.map((r) => (
              <tr key={r.fecha}>
                <td>{String(r.fecha).slice(0, 10)}</td>
                <td>{r.valor}</td>
                <td>{r.fuente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const REFERENCIAS = [
  { id: 'clientes', label: 'Clientes', campos: [{ key: 'nit', label: 'NIT' }, { key: 'nombre', label: 'Nombre' }] },
  { id: 'proveedores', label: 'Proveedores', campos: [{ key: 'nombre', label: 'Nombre' }] },
  { id: 'productos', label: 'Productos', campos: [{ key: 'nombre', label: 'Nombre' }, { key: 'nandina', label: 'Nandina' }] },
  { id: 'aduanas', label: 'Aduanas', campos: [{ key: 'codigo_aduana', label: 'Código' }, { key: 'nombre', label: 'Nombre' }, { key: 'tipo', label: 'Tipo' }, { key: 'ciudad', label: 'Ciudad' }] },
  { id: 'paises', label: 'Países', campos: [{ key: 'nombre', label: 'Nombre' }, { key: 'codigo_iso2', label: 'Código ISO2' }] },
  { id: 'incoterms', label: 'Incoterms', campos: [{ key: 'codigo', label: 'Código' }, { key: 'descripcion', label: 'Descripción' }] },
  { id: 'transportes', label: 'Transportes', campos: [{ key: 'nombre', label: 'Nombre' }] },
];

function ReferenciasSection() {
  const [tabla, setTabla] = useState('clientes');
  const [refresh, setRefresh] = useState(0);
  const data = useData(() => getReferencias(tabla), [tabla, refresh]);
  const [valores, setValores] = useState({});
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const cfg = REFERENCIAS.find((r) => r.id === tabla) || REFERENCIAS[0];

  function cambiarTabla(t) {
    setTabla(t);
    setValores({});
    setMsg(null);
    setErr(null);
  }

  async function agregar(e) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await postReferencia(tabla, valores);
      setValores({});
      setRefresh((n) => n + 1);
      setMsg('Registro agregado.');
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card">
      <h2>Referencias</h2>
      <div className="toolbar">
        <select value={tabla} onChange={(e) => cambiarTabla(e.target.value)}>
          {REFERENCIAS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>
      <form onSubmit={agregar} className="inline-form">
        {cfg.campos.map((c) => (
          <input
            key={c.key}
            placeholder={c.label}
            value={valores[c.key] || ''}
            onChange={(e) => setValores({ ...valores, [c.key]: e.target.value })}
            required
          />
        ))}
        <button type="submit">Agregar</button>
      </form>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {data.loading && <p className="empty">Cargando…</p>}
      {data.error && <p className="error">{data.error}</p>}
      {data.data && data.data.length > 0 && (
        <table>
          <thead><tr>{cfg.campos.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {data.data.map((r, i) => (
              <tr key={i}>{cfg.campos.map((c) => <td key={c.key}>{r[c.key] ?? ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const SECTIONS = [
  { id: 'aduanas', label: 'Aduanas', roles: ['admin'] },
  { id: 'manifiestos', label: 'Manifiestos', roles: ['admin', 'presentacion'] },
  { id: 'combustibles', label: 'Combustibles', roles: ['admin', 'presentacion'] },
  { id: 'presentacion', label: 'Presentación', roles: ['admin', 'presentacion'] },
  { id: 'precio-marcador', label: 'Precio Marcador', roles: ['admin', 'presentacion'] },
  { id: 'tipo-cambio', label: 'Tipo de cambio', roles: ['admin', 'presentacion'] },
  { id: 'referencias', label: 'Referencias', roles: ['admin'] },
  { id: 'usuarios', label: 'Usuarios', roles: ['admin'] },
];

function PrecioMarcadorSection({ canWrite }) {
  const [tab, setTab] = useState('cargar');
  const [refresh, setRefresh] = useState(0);
  const historial = useData(getPrecioMarcador, [refresh]);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const guardados = historial.data ? historial.data.length : 0;

  async function leer(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await previewPrecioMarcador(file);
      setPreview(r.filas || []);
      setMsg(`Leídos ${r.total} registros. Revísalos y pulsa "Procesar y sincronizar".`);
      setTab('cargar');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function procesar() {
    if (!preview || preview.length === 0) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await procesarPrecioMarcador(preview);
      setMsg(`Procesado: ${r.insertados} nuevos, ${r.actualizados} actualizados. Ya puedes rellenar faltantes en la pestaña Historial.`);
      setPreview(null);
      setRefresh((n) => n + 1);
      setTab('historial');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function rellenar() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await rellenarPrecioMarcador();
      if (r.total === 0) {
        setMsg('No hay registros procesados. Sube y procesa un archivo primero.');
      } else {
        setMsg(`Rellenados ${r.rellenados} días faltantes.`);
      }
      setRefresh((n) => n + 1);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function aplicar() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await aplicarPrecioMarcador();
      setMsg(`Aplicado: ${r.combustibles} registros de combustibles y ${r.detalles} de detalles.`);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (!canWrite) {
    return (
      <div className="card">
        <h2>Precio Marcador</h2>
        {historial.loading && <p className="empty">Cargando…</p>}
        {historial.error && <p className="error">{historial.error}</p>}
        {!historial.loading && guardados === 0 && <p className="empty">No hay registros.</p>}
        {guardados > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Fecha</th><th>Precio</th><th>Origen</th></tr></thead>
              <tbody>
                {historial.data.map((r) => (
                  <tr key={r.fecha}><td>{r.fecha}</td><td>{r.precio}</td><td>{r.origen}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Precio Marcador</h2>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="error">{err}</p>}
      <div className="tabs">
        <button className={tab === 'cargar' ? 'active' : ''} onClick={() => setTab('cargar')}>Cargar</button>
        <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>Historial</button>
      </div>
      {tab === 'cargar' && (
        <div>
          <div className="toolbar">
            <input type="file" accept=".xlsx,.xls" onChange={leer} disabled={busy} />
          </div>
          {!preview && <p className="empty">Sube un archivo Excel (hoja "Precio Marcador", columnas fecha y precio).</p>}
          {preview && preview.length === 0 && <p className="empty">El archivo no tiene registros válidos (revisa el nombre de la hoja y las columnas "fecha" y "precio").</p>}
          {preview && preview.length > 0 && (
            <div>
              <p className="dash-sub">{preview.length} registros leídos. Revisa y procesa para guardarlos en la base de datos.</p>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Fecha</th><th>Precio</th></tr></thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={`${r.fecha}-${i}`}><td>{r.fecha}</td><td>{r.precio}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="btn" onClick={procesar} disabled={busy}>Procesar y sincronizar</button>
                <button className="link" onClick={() => { setPreview(null); setMsg(null); }}>Descartar</button>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'historial' && (
        <div>
          <div className="toolbar">
            <button className="btn" onClick={rellenar} disabled={busy || guardados === 0} title={guardados === 0 ? 'Primero procesa un archivo' : ''}>Rellenar faltantes</button>
            <button className="btn" onClick={aplicar} disabled={busy || guardados === 0} title={guardados === 0 ? 'Primero procesa un archivo' : ''}>Aplicar a combustibles</button>
            <span className="run-msg">{guardados} registros guardados</span>
          </div>
          {historial.loading && <p className="empty">Cargando…</p>}
          {historial.error && <p className="error">{historial.error}</p>}
          {!historial.loading && guardados === 0 && <p className="empty">No hay registros guardados. Sube y procesa un archivo en la pestaña Cargar.</p>}
          {guardados > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th>Fecha</th><th>Precio</th><th>Origen</th></tr></thead>
                <tbody>
                  {historial.data.map((r) => (
                    <tr key={r.fecha}><td>{r.fecha}</td><td>{r.precio}</td><td>{r.origen}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const u = await login(usuario.trim(), password);
      onLogin(u);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Import Graco Bolivia</h1>
        <input
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="error">{err}</p>}
        <button type="submit" disabled={busy || !usuario || !password}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function UsuariosSection() {
  const [refresh, setRefresh] = useState(0);
  const data = useData(getUsuarios, [refresh]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ usuario: '', password: '', rol: 'presentacion' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function guardar(e) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      if (editId == null) {
        await postUsuario(form);
        setMsg('Usuario creado.');
      } else {
        await putUsuario(editId, form);
        setMsg('Usuario actualizado.');
      }
      setForm({ usuario: '', password: '', rol: 'presentacion' });
      setEditId(null);
      setRefresh((n) => n + 1);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  function editar(u) {
    setEditId(u.id);
    setForm({ usuario: u.usuario, password: '', rol: u.rol });
    setMsg(null);
    setErr(null);
  }

  async function toggleActivo(u) {
    setErr(null);
    try {
      await putUsuario(u.id, { activo: !u.activo });
      setRefresh((n) => n + 1);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card">
      <h2>Usuarios</h2>
      <form onSubmit={guardar} className="inline-form">
        <input
          placeholder="Usuario"
          value={form.usuario}
          onChange={(e) => setForm({ ...form, usuario: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder={editId == null ? 'Contraseña' : 'Contraseña (dejar vacío para no cambiar)'}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required={editId == null}
        />
        <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
          <option value="presentacion">Presentación</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">{editId == null ? 'Crear' : 'Guardar'}</button>
        {editId != null && (
          <button type="button" className="link" onClick={() => { setEditId(null); setForm({ usuario: '', password: '', rol: 'presentacion' }); }}>
            Cancelar
          </button>
        )}
      </form>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {data.loading && <p className="empty">Cargando…</p>}
      {data.error && <p className="error">{data.error}</p>}
      {data.data && data.data.length > 0 && (
        <table>
          <thead>
            <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {data.data.map((u) => (
              <tr key={u.id} className={u.activo ? '' : 'soft-red'}>
                <td>{u.usuario}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? 'Activo' : 'Desactivado'}</td>
                <td>
                  <button className="link" onClick={() => editar(u)}>Editar</button>
                  <button className="link" onClick={() => toggleActivo(u)}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState({ loading: true, user: null });
  const [section, setSection] = useState('presentacion');

  useEffect(() => {
    getMe()
      .then((u) => setAuth({ loading: false, user: u }))
      .catch(() => setAuth({ loading: false, user: null }));
  }, []);

  async function handleLogin(u) {
    setAuth({ loading: false, user: u });
    setSection('presentacion');
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignora errores de red al cerrar sesión
    }
    setAuth({ loading: false, user: null });
    setSection('presentacion');
  }

  if (auth.loading) {
    return <div className="login-wrap"><p className="empty">Cargando…</p></div>;
  }
  if (!auth.user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const visible = SECTIONS.filter((s) => s.roles.includes(auth.user.rol));
  const canWrite = auth.user.rol === 'admin';

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Import Graco Bolivia</h1>
        <nav>
          {visible.map((s) => (
            <button
              key={s.id}
              className={section === s.id ? 'side-item active' : 'side-item'}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="sidebar-user">{auth.user.usuario} ({auth.user.rol})</span>
          <button className="side-item" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="content">
        {section === 'aduanas' && <AduanasSection />}
        {section === 'manifiestos' && <ManifiestosSection canWrite={canWrite} />}
        {section === 'combustibles' && <CombustiblesSection canWrite={canWrite} />}
        {section === 'presentacion' && <DashboardSection canWrite={canWrite} />}
        {section === 'precio-marcador' && <PrecioMarcadorSection canWrite={canWrite} />}
        {section === 'tipo-cambio' && <TipoCambioSection canWrite={canWrite} />}
        {section === 'referencias' && <ReferenciasSection />}
        {section === 'usuarios' && <UsuariosSection />}
      </main>
    </div>
  );
}
