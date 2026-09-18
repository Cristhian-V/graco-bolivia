import { config } from '../config.js';

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

async function get(url, token, timeoutMs = 20000) {
  const res = await fetch(url, { headers: headers(token), signal: AbortSignal.timeout(timeoutMs) });
  throwHttp(res);
  return res.json();
}

async function post(url, token, body, timeoutMs = 20000) {
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  throwHttp(res);
  return res.json();
}

// Declaración (DIM o DAM) por su número.
export async function getDeclaracionPorNumero(token, num) {
  const data = await get(`${SERVICIOS}/dim/nroDim/${encodeURIComponent(num)}`, token);
  return data?.result ?? data;
}

// Ítems de mercancía de la DIM (H7, H8.2, H11, flete por ítem).
export async function getDatosMercancia(token, dimId) {
  const data = await post(
    `${SERVICIOS}/datosmercanciadim/findByIdDim?page=0&size=100&search=`,
    token,
    { 'data.dim.id': dimId },
  );
  return Array.isArray(data) ? data : [];
}

// Descarga el PDF de la DIM (declaración) como Buffer.
export async function downloadDimPdf(token, dimId) {
  const res = await fetch(`${SERVICIOS}/reporte/DIM/pdf`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ idDocumento: dimId, accion: 'REGISTRO', marcaAgua: 'NO' }),
    signal: AbortSignal.timeout(60000),
  });
  throwHttp(res);
  return Buffer.from(await res.arrayBuffer());
}
