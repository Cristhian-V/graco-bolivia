const BASE = '/api';

async function getJSON(path) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function postJSON(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

async function postFile(path, file) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    body: file,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const getClientes = () => getJSON('/clientes');
export const getAduanas = () => getJSON('/aduanas');
export const postAduana = (codigo_aduana, nombre) =>
  postJSON('/aduanas', { codigo_aduana, nombre });
export const getManifiestos = (nit) =>
  getJSON(`/manifiestos${nit ? `?nit=${encodeURIComponent(nit)}` : ''}`);
export const getCombustibles = (nit, pagina = 1, tipo = 'historial', mes = '') => {
  const qs = new URLSearchParams();
  if (nit) qs.set('nit', nit);
  if (mes) qs.set('mes', mes);
  qs.set('pagina', String(pagina));
  qs.set('tipo', tipo);
  return getJSON(`/combustibles?${qs.toString()}`);
};
export const sincronizarTipoCambioCombustibles = () => postJSON('/tipo-cambio/sincronizar-combustibles', {});
export const getDocumentos = (id) => getJSON(`/combustibles/${id}/documentos`);
export const putCombustible = (id, body) =>
  fetch(`${BASE}/combustibles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  });
export const ignorarTarifa = (id) => postJSON(`/combustibles/${id}/ignorar`, {});
export const ejecutarManifiestos = () => postJSON('/ejecutar-manifiestos', {});
export const ejecutarCombustibles = () => postJSON('/ejecutar-combustibles', {});
export const getTipoCambio = () => getJSON('/tipo-cambio');
export const actualizarTipoCambio = (desde, hasta) =>
  postJSON('/tipo-cambio/actualizar', { desde, hasta });
export const getReferencias = (tabla) => getJSON(`/referencias/${tabla}`);
export const postReferencia = (tabla, body) => postJSON(`/referencias/${tabla}`, body);
export const getDashboardFilters = () => getJSON('/dashboard/filters');
export const getDashboardKpis = (producto, anio, meses) => {
  const qs = new URLSearchParams();
  qs.set('producto', producto);
  if (anio) qs.set('anio', anio);
  if (meses && meses.length) qs.set('mes', meses.join(','));
  return getJSON(`/dashboard/kpis?${qs.toString()}`);
};
export const getDashboardData = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null || v === '') return;
    if (Array.isArray(v)) {
      if (v.length) qs.set(k, v.join(','));
    } else {
      qs.set(k, v);
    }
  });
  const s = qs.toString();
  return getJSON(`/dashboard/data${s ? `?${s}` : ''}`);
};

export const getPrecioMarcador = () => getJSON('/precio-marcador');
export const previewPrecioMarcador = (file) => postFile('/precio-marcador/preview', file);
export const procesarPrecioMarcador = (registros) =>
  postJSON('/precio-marcador/procesar', { registros });
export const rellenarPrecioMarcador = () => postJSON('/precio-marcador/rellenar', {});
export const aplicarPrecioMarcador = () => postJSON('/precio-marcador/aplicar', {});

export const login = (usuario, password) => postJSON('/auth/login', { usuario, password });
export const logout = () => postJSON('/auth/logout', {});
export const getMe = () => getJSON('/auth/me');
export const getUsuarios = () => getJSON('/usuarios');
export const postUsuario = (body) => postJSON('/usuarios', body);
export const putUsuario = (id, body) => {
  return fetch(`${BASE}/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  });
};
