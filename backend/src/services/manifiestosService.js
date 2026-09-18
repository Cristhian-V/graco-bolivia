import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { login } from '../scraper/auth.js';
import {
  countCriBus,
  fetchCriBusPage,
  getManifiesto,
  pdfIdFromManifiesto,
  downloadPdf,
} from '../scraper/manifiestos.js';
import { pool } from '../db.js';
import { config } from '../config.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function toDateStr(ms) {
  if (!ms) return null;
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

function sanitizeNombre(nombre) {
  const s = (nombre || 'CLIENTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return s || 'CLIENTE';
}

// Combustible líquido: al menos un ítem con embalaje a granel o en tanque/cisterna.
// Códigos de embalaje: VL (LÍQUIDO A GRANEL), TY (TANQUE O CISTERNA CILINDRICO),
// TK (TANQUE O CISTERNA RECTANGULAR).
const EMBALAJE_COMBUSTIBLE = new Set(['VL', 'TY', 'TK']);

function esCombustible(r) {
  return (r.detIte || []).some((it) => EMBALAJE_COMBUSTIBLE.has(it?.tipEmb?.cod));
}

async function manifestExists(numMan) {
  const { rows } = await pool.query('SELECT 1 FROM manifiestos WHERE num_man = $1', [numMan]);
  return rows.length > 0;
}

async function nextCorrelativo(nit) {
  const { rows } = await pool.query(
    'SELECT COALESCE(MAX(correlativo), 0) + 1 AS n FROM manifiestos WHERE nit = $1',
    [nit],
  );
  return Number(rows[0].n);
}

async function processManifiesto(token, man, nit, nombre, aduana, fecha, runId, stats) {
  if (await manifestExists(man.numMan)) return;
  const detalle = await getManifiesto(token, man.idMan);
  const pdfId = pdfIdFromManifiesto(detalle);
  if (!pdfId) {
    stats.sinPdf += 1;
    return;
  }
  const correlativo = await nextCorrelativo(nit);
  const nombreArchivo = `${sanitizeNombre(nombre)}_${String(correlativo).padStart(3, '0')}.pdf`;
  const rutaRel = path.join(nit, nombreArchivo);
  const dir = path.dirname(path.join(config.downloadsDir, rutaRel));
  mkdirSync(dir, { recursive: true });
  const buf = await downloadPdf(token, pdfId);
  writeFileSync(path.join(config.downloadsDir, rutaRel), buf);
  await pool.query(
    `INSERT INTO manifiestos (num_man, id_man, nit, aduana, fecha, correlativo, nombre_archivo, ruta_archivo, di, dam, run_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (num_man) DO NOTHING`,
    [man.numMan, man.idMan, nit, aduana, fecha, correlativo, nombreArchivo, rutaRel, man.di, man.dam, runId],
  );
  stats.total += 1;
  stats.nuevos += 1;
}

async function processCliente(token, nit, nombre, desde, hasta, runId, stats) {
  // Se busca por cliente sin acotar aduana (`aduana = null`), que devuelve todas
  // las aduanas del cliente; así no se depende de los PRMs para conocerlas.
  const count = await countCriBus(token, null, nit);
  if (!count || count <= 0) return;

  // Corte consciente de huecos: solo se corta al primer manifiesto existente si
  // los manifiestos guardados del cliente llegan hasta `desde`.
  const { rows: minRows } = await pool.query(
    "SELECT to_char(min(fecha), 'YYYY-MM-DD') AS min FROM manifiestos WHERE nit = $1",
    [nit],
  );
  const minFecha = minRows[0]?.min || null;
  const cortarEnExistente = minFecha != null && minFecha <= desde;

  const pages = Math.ceil(count / config.pageSize);
  const seen = new Set();
  for (let p = 0; p < pages; p++) {
    await delay(config.delayMs);
    const offset = p * config.pageSize;
    const list = await fetchCriBusPage(token, null, nit, offset, config.pageSize);
    if (!Array.isArray(list) || list.length === 0) break;
    let pasadoDesde = false;
    let existente = false;
    for (const r of list) {
      const fecha = toDateStr(r.fecTra);
      if (!fecha || fecha > hasta) continue;
      if (fecha < desde) {
        pasadoDesde = true;
        break;
      }
      const idMan = r.datGen?.idMan;
      const numMan = r.datGen?.numMan;
      if (idMan && numMan && !seen.has(numMan) && esCombustible(r)) {
        seen.add(numMan);
        if (await manifestExists(numMan)) {
          if (cortarEnExistente) {
            existente = true;
            break;
          }
          continue;
        }
        const man = {
          idMan,
          numMan,
          di: r.datGen?.numDocAso2 || null,
          dam: r.datGen?.numDocAso || null,
        };
        await processManifiesto(token, man, nit, nombre, r.datGen?.aduRec?.cod || null, fecha, runId, stats);
      }
    }
    if (pasadoDesde || existente) break;
  }
}

export async function runManifiestos({ desde, hasta, runId, nits }) {
  const stats = { total: 0, nuevos: 0, errores: 0, sinPdf: 0 };
  let token = await login();

  let q = 'SELECT nit, nombre FROM clientes WHERE activo = true';
  const params = [];
  if (Array.isArray(nits) && nits.length > 0) {
    q += ' AND nit = ANY($1::text[])';
    params.push(nits);
  }
  q += ' ORDER BY nit';
  const { rows: clientes } = await pool.query(q, params);

  const totalClientes = clientes.length;
  let idx = 0;
  for (const { nit, nombre } of clientes) {
    idx += 1;
    console.log(`[manifiestos] (${idx}/${totalClientes}) ${nit} ${nombre}`);
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      try {
        await processCliente(token, nit, nombre, desde, hasta, runId, stats);
        done = true;
      } catch (e) {
        if (e.status === 401) {
          token = await login();
          continue;
        }
        if (attempt < 2) {
          await delay(2000);
          continue;
        }
        stats.errores += 1;
        console.error(`[manifiestos] error NIT ${nit}: ${e.message}`);
        done = true;
      }
    }
    await delay(config.delayMs);
  }
  return stats;
}

export async function executeManifiestosRun({ desde, hasta, nits }) {
  const { rows } = await pool.query(
    `INSERT INTO ejecuciones (estado) VALUES ('EN_PROCESO') RETURNING id`,
  );
  const runId = rows[0].id;
  try {
    const stats = await runManifiestos({ desde, hasta, runId, nits });
    await pool.query(
      `UPDATE ejecuciones
       SET estado = 'OK', finalizado_en = now(), total_prm = $1, prm_nuevos = $2, errores = $3
       WHERE id = $4`,
      [stats.total, stats.nuevos, stats.errores, runId],
    );
    return { runId, estado: 'OK', ...stats };
  } catch (e) {
    await pool.query(
      `UPDATE ejecuciones SET estado = 'ERROR', finalizado_en = now(), mensaje = $1 WHERE id = $2`,
      [String(e.message).slice(0, 500), runId],
    );
    throw e;
  }
}
