import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { login } from '../scraper/auth.js';
import { getDeclaracionPorNumero, getDatosMercancia, downloadDimPdf } from '../scraper/declaraciones.js';
import { extraerTextoPdf, parsearFacturaTransporte } from '../scraper/facturaTransporte.js';
import { buscarTipoCambio } from './tipoCambioService.js';
import { buscarPrecioMarcador } from './precioMarcadorService.js';
import { upsertDetalle } from './presentacionService.js';
import { pool } from '../db.js';
import { config } from '../config.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function toDateStr(ms) {
  if (!ms) return null;
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

function sanitize(nombre) {
  const s = (nombre || 'doc')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return s || 'doc';
}

function findDoc(docSop, cod) {
  return (docSop || []).find((d) => d?.tip?.cod === cod);
}

// Parsea el monto de un documento ("58878.83" o "1.234,56").
function parseMonto(mon) {
  if (mon == null) return null;
  let s = String(mon).trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

// Redondea un número a dos decimales.
function r2(x) {
  if (x == null) return null;
  const n = Number(x);
  return Number.isNaN(n) ? null : Number(n.toFixed(2));
}

// Redondea los campos numéricos de un registro a dos decimales.
const CAMPOS_NUMERICOS = [
  'cantidad_m3', 'tipo_cambio_dim', 'us_unitario', 'us_precio_marcador',
  'flete_total_usd', 'flete_total_bs', 'tipo_cambio_trans',
  'tarifa_flete_usd_m3', 'tarifa_flete_bob_m3',
];

function redondearRecord(rec) {
  for (const c of CAMPOS_NUMERICOS) {
    if (rec[c] != null) rec[c] = r2(rec[c]);
  }
  return rec;
}

// Calcula flete_total_usd y flete_total_bs a partir del monto de la factura de
// transporte y su moneda, convirtiendo con el tipo de cambio del BCB.
function calcularFletes(fleteFactura, fleteMoneda, tc) {
  if (fleteFactura == null) return { fleteTotalUsd: null, fleteTotalBs: null };
  if (fleteMoneda === 'BOB') {
    return { fleteTotalUsd: r2(tc != null ? fleteFactura / tc : null), fleteTotalBs: r2(fleteFactura) };
  }
  // USD (o por defecto si no se reconoce la moneda)
  return { fleteTotalUsd: r2(fleteFactura), fleteTotalBs: r2(tc != null ? fleteFactura * tc : null) };
}

function mapDeclaracion(dim, mercs, man, runId) {
  const dg = dim.datGen || {};
  const ideDec = dg.ideDec || {};
  const lug = dg.lug || {};
  const tra = dg.tra || {};
  const fac = Array.isArray(dim.fac) ? dim.fac[0] : dim.fac;
  const facInfTra = fac?.infTra || {};
  const facDetPag = facInfTra.detPag || {};
  const facDetTra = facInfTra.detTra || {};
  const docSop = dim.docSop || [];

  const crtDoc = findDoc(docSop, 'TR-006');
  const transpDoc = findDoc(docSop, 'TR-018');

  const merc = (Array.isArray(mercs) && mercs[0]) || {};
  const ideMer = merc.ideMerIte || {};

  // Litros por unidad comercial conocida (para convertir canCom y preUniUsd a m³).
  // MTQ (metro cúbico) ya viene en m³; el factor es 1000 L/m³.
  const LITROS_POR_UNIDAD = { LTR: 1, GLI: 3.785411784, MTQ: 1000 };

  // Volumen y precio se agregan sobre TODOS los ítems de la DIM (no solo el
  // primero): el flete de la factura de transporte es por declaración completa.
  let cantidadM3 = null;
  let sumUsdM3 = 0;
  for (const m of (Array.isArray(mercs) ? mercs : [])) {
    const im = (m && m.ideMerIte) || {};
    const canCom = im.canCom != null ? Number(im.canCom) : null;
    const canFis = im.canFis != null ? Number(im.canFis) : null;
    const preU = im.preUniUsd != null ? Number(im.preUniUsd) : null;
    const factor = LITROS_POR_UNIDAD[im.uniCom?.cod];
    const m3 = factor && Number.isFinite(canCom)
      ? (canCom * factor) / 1000
      : canFis;
    if (m3 != null && Number.isFinite(m3) && m3 > 0) {
      cantidadM3 = (cantidadM3 || 0) + m3;
      if (preU != null) {
        const usdM3 = factor ? (preU * 1000) / factor : preU * 1000;
        sumUsdM3 += usdM3 * m3;
      }
    }
  }
  const usUnitario = cantidadM3 != null && sumUsdM3 > 0 ? sumUsdM3 / cantidadM3 : null;

  const fleteFactura = parseMonto(transpDoc?.camDin?.mon);
  const fleteMoneda = transpDoc?.camDin?.tipMon?.cod ?? null;

  const lugEmb = lug.lugEmb?.des ?? null;
  const lugDest = lug.depDes?.des ?? null;

  return {
    dim_dam: dim.num,
    crt: crtDoc?.camDin?.num ?? null,
    uso: facDetTra.desMer?.des ?? null,
    fecha: man.fecha || toDateStr(dim.fecTra),
    aduana: lug.aduDes?.des ?? null,
    incoterm: facInfTra.inc?.conEntInc?.cod ?? null,
    producto: ideMer.desMinMer?.objVal?.espNomMerTxt ?? null,
    proveedor: fac?.pro?.pro?.nomRazSoc ?? null,
    importador: dg.ope?.imp?.nomRazSoc ?? null,
    transporte: transpDoc?.camDin?.emi ?? null,
    cantidad_m3: cantidadM3,
    tipo_cambio_dim: facDetPag.tipCamUsdBob != null ? Number(facDetPag.tipCamUsdBob) : null,
    tramo_flete: lugEmb && lugDest ? `${lugEmb} - ${lugDest}` : lugEmb || lugDest,
    us_unitario: usUnitario,
    importador_nit: dg.ope?.imp?.numDoc ?? null,
    pais_procedencia: lug.paiPro?.des ?? null,
    modalidad_despacho: ideDec.modDep?.des ?? null,
    us_precio_marcador: 1120,
    fecha_factura_trans: transpDoc?.camDin?.fecEmi ? toDateStr(transpDoc.camDin.fecEmi) : null,
    flete_total_usd: null,
    flete_total_bs: null,
    tipo_cambio_trans: null,
    tarifa_flete_usd_m3: null,
    tarifa_flete_bob_m3: null,
    fleteFactura,
    fleteMoneda,
    nit: man.nit,
    run_id: runId,
    raw: dim,
  };
}

const UPSERT_SQL = `
INSERT INTO combustibles (dim_dam, crt, uso, fecha, aduana, incoterm, producto, proveedor,
  importador, transporte, cantidad_m3, tipo_cambio_dim, tramo_flete, us_unitario,
  importador_nit, pais_procedencia, modalidad_despacho, us_precio_marcador,
  fecha_factura_trans, flete_total_usd, flete_total_bs, tipo_cambio_trans,
  tarifa_flete_usd_m3, tarifa_flete_bob_m3, nit, run_id, raw)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
ON CONFLICT (dim_dam) DO UPDATE SET
  crt=EXCLUDED.crt, uso=EXCLUDED.uso, fecha=EXCLUDED.fecha, aduana=EXCLUDED.aduana,
  incoterm=EXCLUDED.incoterm, producto=EXCLUDED.producto, proveedor=EXCLUDED.proveedor,
  importador=EXCLUDED.importador, transporte=EXCLUDED.transporte, cantidad_m3=EXCLUDED.cantidad_m3,
  tipo_cambio_dim=EXCLUDED.tipo_cambio_dim, tramo_flete=EXCLUDED.tramo_flete,
  us_unitario=EXCLUDED.us_unitario,
  importador_nit=EXCLUDED.importador_nit, pais_procedencia=EXCLUDED.pais_procedencia,
  modalidad_despacho=EXCLUDED.modalidad_despacho, us_precio_marcador=EXCLUDED.us_precio_marcador,
  fecha_factura_trans=EXCLUDED.fecha_factura_trans, flete_total_usd=EXCLUDED.flete_total_usd,
  flete_total_bs=EXCLUDED.flete_total_bs, tipo_cambio_trans=EXCLUDED.tipo_cambio_trans,
  tarifa_flete_usd_m3=EXCLUDED.tarifa_flete_usd_m3, tarifa_flete_bob_m3=EXCLUDED.tarifa_flete_bob_m3,
  nit=EXCLUDED.nit, run_id=EXCLUDED.run_id, raw=EXCLUDED.raw, actualizado_en=now()
RETURNING (xmax = 0) AS is_new
`;

async function upsertCombustible(rec) {
  redondearRecord(rec);
  const v = [
    rec.dim_dam, rec.crt, rec.uso, rec.fecha, rec.aduana, rec.incoterm, rec.producto,
    rec.proveedor, rec.importador, rec.transporte, rec.cantidad_m3, rec.tipo_cambio_dim,
    rec.tramo_flete, rec.us_unitario, rec.importador_nit,
    rec.pais_procedencia, rec.modalidad_despacho, rec.us_precio_marcador,
    rec.fecha_factura_trans, rec.flete_total_usd, rec.flete_total_bs, rec.tipo_cambio_trans,
    rec.tarifa_flete_usd_m3, rec.tarifa_flete_bob_m3,
    rec.nit, rec.run_id, JSON.stringify(rec.raw),
  ];
  const res = await pool.query(UPSERT_SQL, v);
  await upsertDetalle(rec);
  return res.rows[0]?.is_new === true;
}

async function declaracionProcesada(dimDam) {
  const { rows } = await pool.query(
    'SELECT 1 FROM declaraciones_procesadas WHERE dim_dam = $1',
    [dimDam],
  );
  return rows.length > 0;
}

async function marcarProcesada(dimDam, estado) {
  await pool.query(
    `INSERT INTO declaraciones_procesadas (dim_dam, estado)
     VALUES ($1, $2) ON CONFLICT (dim_dam) DO NOTHING`,
    [dimDam, estado],
  );
}

async function documentoSaved(dimDam, tipo, num) {
  const { rows } = await pool.query(
    'SELECT 1 FROM documentos_despacho WHERE dim_dam=$1 AND tipo=$2 AND num=$3',
    [dimDam, tipo, num],
  );
  return rows.length > 0;
}

async function downloadDocumentos(token, dim, dimDam) {
  const docSop = dim.docSop || [];

  // 1. PDF de la propia DIM.
  if (!(await documentoSaved(dimDam, 'DIM', dim.num))) {
    const bufDim = await downloadDimPdf(token, dim.id);
    const nombreDim = `DIM_${sanitize(dim.num)}.pdf`;
    const rutaDim = path.join(dimDam, nombreDim);
    const dirDim = path.dirname(path.join(config.documentosDespachoDir, rutaDim));
    mkdirSync(dirDim, { recursive: true });
    writeFileSync(path.join(config.documentosDespachoDir, rutaDim), bufDim);
    await pool.query(
      `INSERT INTO documentos_despacho (dim_dam, tipo, tipo_des, num, emi, nombre_archivo, ruta_archivo)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (dim_dam, tipo, num) DO NOTHING`,
      [dimDam, 'DIM', 'DECLARACIÓN DE IMPORTACIÓN', dim.num, null, nombreDim, rutaDim],
    );
  }

  // 2. Documentos de soporte (L. Documentos): se registran con su URL pública de
  //    la aduana (`b-oce/rest/downloadFile/{id}`), sin descargar el archivo.
  for (const doc of docSop) {
    const arc = doc?.arc;
    if (!arc?.id) continue;
    const tipo = doc?.tip?.cod ?? null;
    const numDoc = doc?.camDin?.num ?? doc?.camDin?.nro ?? null;
    if (await documentoSaved(dimDam, tipo, numDoc)) continue;
    const nombreArchivo = arc.nom ? sanitize(arc.nom) : `${tipo}_${sanitize(numDoc || '')}.pdf`;
    const url = `${config.suma.baseUrl}/b-oce/rest/downloadFile/${arc.id}`;
    await pool.query(
      `INSERT INTO documentos_despacho (dim_dam, tipo, tipo_des, num, emi, nombre_archivo, url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (dim_dam, tipo, num) DO NOTHING`,
      [dimDam, tipo, doc?.tip?.des ?? null, numDoc, doc?.camDin?.emi ?? null, nombreArchivo, url],
    );
  }
}

export async function runCombustibles({ runId, nits, desde, hasta }) {
  const stats = { total: 0, nuevos: 0, errores: 0, ignorados: 0 };
  if (!desde) desde = config.fechaDesde;
  let token = await login();

  let q = 'SELECT id, num_man, nit, aduana, fecha, di, dam FROM manifiestos WHERE di IS NOT NULL';
  const params = [];
  if (Array.isArray(nits) && nits.length > 0) {
    params.push(nits);
    q += ` AND nit = ANY($${params.length}::text[])`;
  }
  if (desde) {
    params.push(desde);
    q += ` AND fecha >= $${params.length}::date`;
  }
  if (hasta) {
    params.push(hasta);
    q += ` AND fecha <= $${params.length}::date`;
  }
  q += ' ORDER BY nit, fecha';
  const { rows: mans } = await pool.query(q, params);

  const total = mans.length;
  let idx = 0;
  for (const man of mans) {
    idx += 1;
    const numDecl = man.di;
    if (await declaracionProcesada(numDecl)) {
      console.log(`[combustibles] (${idx}/${total}) ${numDecl} ya procesado, se omite`);
      continue;
    }
    console.log(`[combustibles] (${idx}/${total}) ${numDecl} (${man.nit})`);
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      try {
        const dim = await getDeclaracionPorNumero(token, numDecl);
        const mercs = await getDatosMercancia(token, dim.id);
        const rec = mapDeclaracion(dim, mercs, man, runId);
        const tipoProducto = clasificarProducto(rec.producto);
        if (!tipoProducto) {
          await marcarProcesada(numDecl, 'NO_COMBUSTIBLE');
          stats.ignorados += 1;
          done = true;
          continue;
        }
        rec.producto = tipoProducto;
        rec.us_precio_marcador = (await buscarPrecioMarcador(rec.fecha)) ?? 1120;
        await downloadDocumentos(token, dim, rec.dim_dam);
        rec.tipo_cambio_trans = await buscarTipoCambio(rec.fecha_factura_trans);
        const fletes = calcularFletes(rec.fleteFactura, rec.fleteMoneda, rec.tipo_cambio_trans);
        rec.flete_total_usd = fletes.fleteTotalUsd;
        rec.flete_total_bs = fletes.fleteTotalBs;
        rec.tarifa_flete_usd_m3 = rec.cantidad_m3 != null && rec.flete_total_usd != null
          ? rec.flete_total_usd / rec.cantidad_m3
          : null;
        rec.tarifa_flete_bob_m3 = rec.cantidad_m3 != null && rec.flete_total_bs != null
          ? rec.flete_total_bs / rec.cantidad_m3
          : null;
        const isNew = await upsertCombustible(rec);
        await marcarProcesada(numDecl, 'COMBUSTIBLE');
        stats.total += 1;
        if (isNew) stats.nuevos += 1;
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
        console.error(`[combustibles] error ${numDecl}: ${e.message}`);
        done = true;
      }
    }
    await delay(config.delayMs);
  }
  return stats;
}

export async function executeCombustiblesRun({ nits, desde, hasta }) {
  const { rows } = await pool.query(
    `INSERT INTO ejecuciones (estado) VALUES ('EN_PROCESO') RETURNING id`,
  );
  const runId = rows[0].id;
  try {
    const stats = await runCombustibles({ runId, nits, desde, hasta });
    await pool.query(
      `UPDATE ejecuciones SET estado='OK', finalizado_en=now(), total_prm=$1, prm_nuevos=$2, errores=$3 WHERE id=$4`,
      [stats.total, stats.nuevos, stats.errores, runId],
    );
    return { runId, estado: 'OK', ...stats };
  } catch (e) {
    await pool.query(
      `UPDATE ejecuciones SET estado='ERROR', finalizado_en=now(), mensaje=$1 WHERE id=$2`,
      [String(e.message).slice(0, 500), runId],
    );
    throw e;
  }
}

function clasificarProducto(nombre) {
  if (!nombre) return null;
  const n = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
  if (n.includes('GASOLINA')) return 'GASOLINA';
  if (n.includes('DIESEL') || n.includes('GASOIL') || n.includes('GAS OIL') || n.includes('GASOLEO') || n.includes('ULSD')) {
    return 'DIESEL';
  }
  return null;
}
