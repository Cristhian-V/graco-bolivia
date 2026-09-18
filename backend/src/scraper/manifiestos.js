import { config } from '../config.js';

const INGRESO = `${config.suma.baseUrl}/n-ingreso/api/json`;
const SERVICIOS = `${config.serviciosBaseUrl}/ssu-mim-ingreso-rest`;

function headers(token) {
  return {
    'Content-Type': 'application/json',
    'Auth-Token': token,
    User: config.suma.usuario,
    charset: 'UTF-8',
  };
}

function throwHttp(res) {
  if (res.status === 401) {
    const err = new Error('Sesión no autenticada (401)');
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
}

async function post(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  throwHttp(res);
  return res.json();
}

async function get(url, token, timeoutMs = 20000) {
  const res = await fetch(url, {
    headers: headers(token),
    signal: AbortSignal.timeout(timeoutMs),
  });
  throwHttp(res);
  return res;
}

// Búsqueda "Agrupación de PRM's": lista PRMs por consignatario (NIT importador) + aduana de recepción.
export async function countCriBus(token, aduRec, numDocCos) {
  const data = await post(
    `${INGRESO}/pre/${config.suma.declaranteNit}/criBus/count`,
    token,
    { aduRec, numDocCos },
  );
  return Number(data);
}

export async function fetchCriBusPage(token, aduRec, numDocCos, offset, size) {
  return post(
    `${INGRESO}/pre/${config.suma.declaranteNit}/criBus?page=${offset}&size=${size}`,
    token,
    { aduRec, numDocCos },
  );
}

// Detalle del manifiesto (devuelve el objeto bajo `result`).
export async function getManifiesto(token, idMan) {
  const res = await get(`${SERVICIOS}/manifiesto/${idMan}`, token);
  const data = await res.json();
  return data?.result ?? data;
}

// Lógica "Ver Manifiesto": último docFir.id; si no, docSopMic (TR-007/BT).arc.id.
export function pdfIdFromManifiesto(man) {
  const docFir = man?.infTec?.docFir;
  if (Array.isArray(docFir) && docFir.length > 0) {
    return docFir[docFir.length - 1].id;
  }
  const docSopMic = man?.docSopMic;
  if (Array.isArray(docSopMic)) {
    for (const d of docSopMic) {
      if ((d?.tip?.cod === 'TR-007' || d?.tip?.cod === 'BT') && d?.arc?.id) {
        return d.arc.id;
      }
    }
  }
  return null;
}

// Descarga el PDF y lo devuelve como Buffer.
export async function downloadPdf(token, id) {
  const res = await get(`${SERVICIOS}/reporte/visor/${id}`, token, 60000);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}
