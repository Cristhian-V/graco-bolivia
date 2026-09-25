import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import { pool } from '../db.js';

// Columnas de negocio de la tabla detalles (espejo de combustibles).
export const COLUMNAS_DETALLES = [
  'crt', 'uso', 'fecha', 'aduana', 'dim_dam', 'incoterm', 'producto', 'proveedor',
  'importador', 'transporte', 'cantidad_m3', 'tipo_cambio_dim', 'tramo_flete',
  'us_unitario', 'importador_nit', 'pais_procedencia', 'modalidad_despacho',
  'us_precio_marcador', 'fecha_factura_trans', 'flete_total_usd', 'flete_total_bs',
  'tipo_cambio_trans', 'tarifa_flete_usd_m3', 'tarifa_flete_bob_m3',
];

const CAMPOS_NUMERICOS = [
  'cantidad_m3', 'tipo_cambio_dim', 'us_unitario', 'us_precio_marcador',
  'flete_total_usd', 'flete_total_bs', 'tipo_cambio_trans',
  'tarifa_flete_usd_m3', 'tarifa_flete_bob_m3',
];

function r2(x) {
  if (x == null) return null;
  const n = Number(x);
  return Number.isNaN(n) ? null : Number(n.toFixed(2));
}

function redondear(rec) {
  for (const c of CAMPOS_NUMERICOS) {
    if (rec[c] != null) rec[c] = r2(rec[c]);
  }
  return rec;
}

function toFecha(v) {
  if (v == null) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  return s ? s.slice(0, 10) : null;
}

const DETALLES_UPSERT_SQL = `
INSERT INTO detalles (crt, uso, fecha, aduana, dim_dam, incoterm, producto, proveedor,
  importador, transporte, cantidad_m3, tipo_cambio_dim, tramo_flete, us_unitario,
  importador_nit, pais_procedencia, modalidad_despacho, us_precio_marcador,
  fecha_factura_trans, flete_total_usd, flete_total_bs, tipo_cambio_trans,
  tarifa_flete_usd_m3, tarifa_flete_bob_m3)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
ON CONFLICT (dim_dam) DO UPDATE SET
  crt=EXCLUDED.crt, uso=EXCLUDED.uso, fecha=EXCLUDED.fecha, aduana=EXCLUDED.aduana,
  incoterm=EXCLUDED.incoterm, producto=EXCLUDED.producto, proveedor=EXCLUDED.proveedor,
  importador=EXCLUDED.importador, transporte=EXCLUDED.transporte,
  cantidad_m3=EXCLUDED.cantidad_m3, tipo_cambio_dim=EXCLUDED.tipo_cambio_dim,
  tramo_flete=EXCLUDED.tramo_flete, us_unitario=EXCLUDED.us_unitario,
  importador_nit=EXCLUDED.importador_nit, pais_procedencia=EXCLUDED.pais_procedencia,
  modalidad_despacho=EXCLUDED.modalidad_despacho, us_precio_marcador=EXCLUDED.us_precio_marcador,
  fecha_factura_trans=EXCLUDED.fecha_factura_trans, flete_total_usd=EXCLUDED.flete_total_usd,
  flete_total_bs=EXCLUDED.flete_total_bs, tipo_cambio_trans=EXCLUDED.tipo_cambio_trans,
  tarifa_flete_usd_m3=EXCLUDED.tarifa_flete_usd_m3, tarifa_flete_bob_m3=EXCLUDED.tarifa_flete_bob_m3,
  actualizado_en=now()
`;

async function nombreCliente(nit) {
  if (!nit) return null;
  const { rows } = await pool.query('SELECT nombre FROM clientes WHERE nit = $1', [String(nit)]);
  return rows.length ? rows[0].nombre : null;
}

// Inserta o actualiza un registro en detalles normalizando el importador por NIT.
export async function upsertDetalle(rec, clientesMap) {
  redondear(rec);
  let nombre = rec.importador ?? null;
  if (rec.importador_nit) {
    if (clientesMap) {
      const n = clientesMap.get(String(rec.importador_nit));
      if (n) nombre = n;
    } else {
      const n = await nombreCliente(rec.importador_nit);
      if (n) nombre = n;
    }
  }
  const v = COLUMNAS_DETALLES.map((c) => {
    if (c === 'importador') return nombre;
    if (c === 'fecha' || c === 'fecha_factura_trans') return toFecha(rec[c]);
    return rec[c] ?? null;
  });
  await pool.query(DETALLES_UPSERT_SQL, v);
}

// Carga el histórico desde un archivo Excel (hoja "detalles") y hace upsert.
export async function seedDetallesDesdeExcel(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('detalles');
  if (!ws) throw new Error('Hoja "detalles" no encontrada en el archivo');

  const header = [];
  ws.getRow(1).eachCell((cell, col) => {
    header[col] = String(cell.value ?? '').trim();
  });

  const { rows: clientes } = await pool.query('SELECT nit, nombre FROM clientes');
  const clientesMap = new Map(clientes.map((c) => [String(c.nit), c.nombre]));

  const filas = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const rec = {};
    row.eachCell((cell, col) => {
      const h = header[col];
      if (h) rec[h] = cell.value;
    });
    let dimDam = rec.dim_dam != null ? String(rec.dim_dam).trim() : '';
    if (!dimDam) {
      // Registros históricos sin DIM/DAM: se genera una clave sintética estable
      // a partir de todas las columnas para que la recarga sea idempotente y
      // solo se fusionen filas exactamente iguales.
      const base = header.filter(Boolean).map((h) => String(rec[h] ?? '')).join('|');
      dimDam = `HIST-${createHash('sha1').update(base).digest('hex').slice(0, 16)}`;
    }
    rec.dim_dam = dimDam;
    filas.push(rec);
  });

  for (const rec of filas) {
    if ((rec.tarifa_flete_bob_m3 == null || rec.tarifa_flete_bob_m3 === '')
      && rec.flete_total_bs != null && rec.cantidad_m3 != null) {
      const bs = parseFloat(rec.flete_total_bs);
      const m3 = parseFloat(rec.cantidad_m3);
      if (Number.isFinite(bs) && Number.isFinite(m3) && m3 !== 0) {
        rec.tarifa_flete_bob_m3 = r2(bs / m3);
      }
    }
    await upsertDetalle(rec, clientesMap);
  }
  return { total: filas.length, insertados: filas.length };
}

// ==================== PANEL DE VISUALIZACIÓN ====================

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function splitLista(v) {
  if (v == null) return [];
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

function buildWhere(query) {
  const conditions = [];
  const values = [];
  let i = 1;

  const desde = String(query.desde || '').trim();
  const hasta = String(query.hasta || '').trim();
  const tieneRango = Boolean(desde || hasta);

  if (!tieneRango) {
    const meses = splitLista(query.mes).map((m) => parseInt(m, 10)).filter((n) => Number.isInteger(n));
    if (meses.length) {
      conditions.push(`EXTRACT(MONTH FROM fecha)::int = ANY($${i}::int[])`);
      values.push(meses);
      i += 1;
    }
  }

  const anios = splitLista(query.anio).map((a) => parseInt(a, 10)).filter((n) => Number.isInteger(n));
  if (anios.length) {
    conditions.push(`EXTRACT(YEAR FROM fecha)::int = ANY($${i}::int[])`);
    values.push(anios);
    i += 1;
  }

  if (desde) {
    conditions.push(`fecha >= $${i}::date`);
    values.push(desde);
    i += 1;
  }
  if (hasta) {
    conditions.push(`fecha <= $${i}::date`);
    values.push(hasta);
    i += 1;
  }

  const nits = splitLista(query.nit);
  if (nits.length) {
    conditions.push(`importador_nit = ANY($${i}::text[])`);
    values.push(nits);
    i += 1;
  }

  const importadores = splitLista(query.importador);
  if (importadores.length) {
    const impNits = importadores.filter((v) => /^\d+$/.test(v));
    const impNames = importadores.filter((v) => !/^\d+$/.test(v));
    const parts = [];
    if (impNits.length) {
      parts.push(`importador_nit = ANY($${i}::text[])`);
      values.push(impNits);
      i += 1;
    }
    if (impNames.length) {
      parts.push(`importador = ANY($${i}::text[])`);
      values.push(impNames);
      i += 1;
    }
    conditions.push(`(${parts.join(' OR ')})`);
  }

  const campos = [
    ['proveedor', 'proveedor'],
    ['procedencia', 'pais_procedencia'],
    ['aduana', 'aduana'],
    ['producto', 'producto'],
  ];
  for (const [q, col] of campos) {
    const items = splitLista(query[q]);
    if (items.length) {
      conditions.push(`${col} = ANY($${i}::text[])`);
      values.push(items);
      i += 1;
    }
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
}

export async function getDashboardFilters() {
  const fdefs = [
    { key: 'anio', sql: 'SELECT DISTINCT EXTRACT(YEAR FROM fecha)::int AS anio FROM detalles WHERE fecha IS NOT NULL ORDER BY anio' },
    { key: 'mes', sql: 'SELECT DISTINCT EXTRACT(MONTH FROM fecha)::int AS mes FROM detalles WHERE fecha IS NOT NULL ORDER BY mes' },
    { key: 'importador', sql: 'SELECT importador, MAX(importador_nit) AS nit FROM detalles WHERE importador IS NOT NULL GROUP BY importador ORDER BY importador' },
    { key: 'proveedor', sql: 'SELECT DISTINCT proveedor FROM detalles WHERE proveedor IS NOT NULL ORDER BY proveedor' },
    { key: 'procedencia', sql: 'SELECT DISTINCT pais_procedencia AS procedencia FROM detalles WHERE pais_procedencia IS NOT NULL ORDER BY procedencia' },
    { key: 'aduana', sql: 'SELECT DISTINCT aduana FROM detalles WHERE aduana IS NOT NULL ORDER BY aduana' },
  ];

  const result = {};
  for (const { key, sql } of fdefs) {
    const { rows } = await pool.query(sql);
    if (key === 'mes') {
      result.mes = rows
        .map((r) => ({ value: String(r.mes), label: MESES[r.mes - 1] }))
        .filter((m) => m.label);
    } else if (key === 'anio') {
      result.anio = rows.map((r) => String(r.anio));
    } else if (key === 'importador') {
      result.importador = rows.map((r) => ({
        value: r.nit || r.importador,
        label: r.importador,
        nit: r.nit,
      }));
    } else {
      result[key] = rows.map((r) => r[key]);
    }
  }
  result.producto = ['DIESEL', 'GASOLINA'];
  return result;
}

const KPI_SELECT = `SELECT
  COUNT(*)::int AS num_operaciones,
  COUNT(DISTINCT importador)::int AS importadores,
  ROUND(COALESCE(AVG(NULLIF(us_precio_marcador, 0)), 0)::numeric, 2) AS precio_marcador,
  ROUND(COALESCE(AVG(NULLIF(us_unitario, 0)), 0)::numeric, 2) AS precio_promedio,
  ROUND(COALESCE(SUM(us_unitario * cantidad_m3), 0)::numeric, 2) AS total_cif,
  ROUND(COALESCE(SUM(cantidad_m3), 0)::numeric, 2) AS volumen_total,
  ROUND(COALESCE(SUM(flete_total_bs), 0)::numeric, 2) AS flete_total_bs,
  ROUND(COALESCE(SUM(flete_total_bs) / NULLIF(SUM(cantidad_m3), 0), 0)::numeric, 2) AS tarifa_flete_bob_prom
`;

export async function getDashboardKpis(query) {
  const { where, values } = buildWhere({
    producto: query.producto || '',
    anio: query.anio,
    mes: query.mes,
  });
  const { rows } = await pool.query(`${KPI_SELECT} FROM detalles d ${where}`, values);
  return rows[0] || {};
}

export async function getDashboardData(query) {
  const { where, values } = buildWhere(query);
  const FROM = 'FROM detalles d';

  if (query.chart === 'weekly') {
    const extra = 'importador IS NOT NULL';
    const whereFull = where ? `${where} AND ${extra}` : `WHERE ${extra}`;
    const { rows } = await pool.query(`
      SELECT to_char(date_trunc('week', fecha)::date, 'YYYY-MM-DD') AS inicio,
        string_agg(DISTINCT importador, ' | ') AS importadores,
        ROUND(SUM((us_unitario + COALESCE(tarifa_flete_usd_m3, 0)) * cantidad_m3)
          / NULLIF(SUM(cantidad_m3), 0)::numeric, 2) AS importacion,
        ROUND(AVG(us_precio_marcador)::numeric, 2) AS marcador
      ${FROM} ${whereFull}
      GROUP BY date_trunc('week', fecha) ORDER BY 1
    `, values);
    return { weekly: rows };
  }

  if (query.chart === 'burbujas') {
    const extra = 'importador IS NOT NULL AND tipo_cambio_dim IS NOT NULL';
    const whereFull = where ? `${where} AND ${extra}` : `WHERE ${extra}`;
    const { rows } = await pool.query(`
      SELECT importador AS empresa,
        MAX(importador_nit) AS nit,
        ROUND(SUM(((us_unitario + COALESCE(tarifa_flete_usd_m3, 0)) / 1000 * tipo_cambio_dim) * cantidad_m3)
          / NULLIF(SUM(cantidad_m3), 0)::numeric, 2) AS precio_bs_litro,
        ROUND(SUM(cantidad_m3)::numeric, 2) AS volumen
      ${FROM} ${whereFull}
      GROUP BY importador ORDER BY precio_bs_litro DESC NULLS LAST
    `, values);
    return { burbujas: rows };
  }

  const kpiSql = `${KPI_SELECT} ${FROM} ${where}`;

  const grp = (sel, order = 'valor DESC', limit = null) =>
    `${sel} ${FROM} ${where} GROUP BY label ORDER BY ${order} NULLS LAST${limit ? ` LIMIT ${limit}` : ''}`;

  const queries = [
    kpiSql,
    grp(`SELECT importador AS label, ROUND(SUM((us_unitario + COALESCE(tarifa_flete_usd_m3, 0)) * cantidad_m3) / NULLIF(SUM(cantidad_m3), 0)::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT importador AS label, ROUND(SUM(cantidad_m3)::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT proveedor AS label, ROUND(SUM(cantidad_m3)::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT pais_procedencia AS label, ROUND(SUM(cantidad_m3)::numeric, 2) AS valor`, 'valor DESC'),
    grp(`SELECT NULLIF(tramo_flete, '') AS label, ROUND(AVG(NULLIF(tarifa_flete_usd_m3, 0))::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT NULLIF(tramo_flete, '') AS label, ROUND(AVG(NULLIF(tarifa_flete_bob_m3, 0))::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT pais_procedencia AS label, ROUND(SUM(us_unitario * cantidad_m3)::numeric, 2) AS valor`, 'valor DESC'),
    grp(`SELECT importador AS label, ROUND(SUM(us_unitario * cantidad_m3)::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT importador AS label, ROUND(SUM(cantidad_m3)::numeric, 2) AS valor`, 'valor DESC', 7),
    grp(`SELECT importador AS label, ROUND(AVG(NULLIF(us_unitario, 0))::numeric, 2) AS valor`, 'valor DESC', 7),
    `SELECT importador AS empresa, EXTRACT(MONTH FROM fecha)::int AS mes, COUNT(*)::int AS ops
     ${FROM} ${where} AND importador IS NOT NULL GROUP BY importador, mes ORDER BY importador, mes`,
  ];

  const [
    kpi, pe, ve, sp, vp, ft, ftb, cp, ci, vi, pi, mo,
  ] = await Promise.all(queries.map((q) => pool.query(q, values)));

  const toObj = (rows) => {
    const obj = {};
    for (const r of rows) {
      if (r.label != null && r.valor != null) obj[r.label] = parseFloat(r.valor);
    }
    return obj;
  };

  const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthly_ops = {};
  for (const r of mo.rows) {
    if (!monthly_ops[r.empresa]) {
      monthly_ops[r.empresa] = Object.fromEntries(MONTH_KEYS.map((m) => [m, 0]));
    }
    const key = MONTH_KEYS[r.mes - 1];
    if (key) monthly_ops[r.empresa][key] = parseInt(r.ops, 10);
  }

  return {
    kpis: kpi.rows[0] || {},
    precio_empresa: toObj(pe.rows),
    vol_empresa: toObj(ve.rows),
    share_proveedor: toObj(sp.rows),
    vol_procedencia: toObj(vp.rows),
    flete_tramo: toObj(ft.rows),
    flete_tramo_bob: toObj(ftb.rows),
    cif_pais: toObj(cp.rows),
    cif_importador: toObj(ci.rows),
    vol_importador: toObj(vi.rows),
    precio_importador: toObj(pi.rows),
    monthly_ops,
  };
}

// ==================== MARCADORES DE REFERENCIA (burbujas) ====================

export async function getMarcadores() {
  const { rows } = await pool.query(
    'SELECT grafico, valor FROM marcadores_burbuja ORDER BY grafico, orden, valor',
  );
  const out = { empresa: [], ypfb: [] };
  for (const r of rows) {
    if (!out[r.grafico]) out[r.grafico] = [];
    out[r.grafico].push(Number(r.valor));
  }
  return out;
}

// Reemplaza el conjunto de marcadores de un grafico (guarda los vigentes y
// elimina los que se quitaron).
export async function setMarcadores(grafico, valores) {
  const nums = (Array.isArray(valores) ? valores : [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM marcadores_burbuja WHERE grafico = $1', [grafico]);
    let orden = 0;
    for (const valor of nums) {
      await client.query(
        `INSERT INTO marcadores_burbuja (grafico, valor, orden)
         VALUES ($1, $2, $3) ON CONFLICT (grafico, valor) DO NOTHING`,
        [grafico, valor, orden],
      );
      orden += 1;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return getMarcadores();
}
