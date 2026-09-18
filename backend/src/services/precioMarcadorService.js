import XLSX from 'xlsx';
import { pool } from '../db.js';

function r2(x) {
  if (x == null) return null;
  const n = Number(x);
  return Number.isNaN(n) ? null : Number(n.toFixed(2));
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

function parsePrecio(v) {
  if (v == null) return null;
  if (typeof v === 'object' && v.result != null) v = v.result;
  const s = String(v).trim();
  if (!s) return null;
  const n = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s);
  return Number.isNaN(n) ? null : r2(n);
}

function addDias(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Lee el Excel (hoja "Precio Marcador") y devuelve los registros sin persistir.
// Soporta .xlsx y .xls (SheetJS lee ambos formatos).
export async function leerPrecioMarcador(buffer) {
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new Error('No se pudo leer el archivo. Debe ser un Excel (.xlsx o .xls) válido.');
  }

  const sheetName = (wb.SheetNames || [])
    .find((n) => String(n).trim().toLowerCase() === 'precio marcador');
  if (!sheetName) throw new Error('Hoja "Precio Marcador" no encontrada en el archivo');

  const ws = wb.Sheets[sheetName];
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  const header = (matriz[0] || []).map((h) => String(h ?? '').trim().toLowerCase());
  const colFecha = header.indexOf('fecha');
  const colPrecio = header.indexOf('precio');
  if (colFecha < 0 || colPrecio < 0) {
    throw new Error('La hoja "Precio Marcador" debe tener columnas "fecha" y "precio"');
  }

  const filas = [];
  for (let i = 1; i < matriz.length; i += 1) {
    const row = matriz[i] || [];
    const fecha = toFecha(row[colFecha]);
    const precio = parsePrecio(row[colPrecio]);
    if (fecha && precio != null) filas.push({ fecha, precio });
  }
  filas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  return { total: filas.length, filas };
}

// Upsert de los registros confirmados en la vista previa (origen EXCEL).
export async function procesarPrecioMarcador(registros) {
  const lista = Array.isArray(registros) ? registros : [];
  let insertados = 0;
  let actualizados = 0;
  for (const r of lista) {
    const fecha = toFecha(r.fecha);
    const precio = parsePrecio(r.precio);
    if (!fecha || precio == null) continue;
    const res = await pool.query(
      `INSERT INTO precio_marcador (fecha, precio, origen)
       VALUES ($1, $2, 'EXCEL')
       ON CONFLICT (fecha) DO UPDATE SET
         precio = EXCLUDED.precio, origen = 'EXCEL', actualizado_en = now()
       RETURNING (xmax = 0) AS is_new`,
      [fecha, precio],
    );
    if (res.rows[0]?.is_new) insertados += 1;
    else actualizados += 1;
  }
  return { total: lista.length, insertados, actualizados };
}

// Rellena los días sin precio dentro del rango, promediando los 3 registros
// del archivo anteriores y los 3 posteriores más cercanos. Recalculable.
export async function rellenarPrecioMarcador() {
  const { rows } = await pool.query(
    `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, precio
     FROM precio_marcador WHERE origen = 'EXCEL' ORDER BY fecha`,
  );
  if (rows.length === 0) return { total: 0, rellenados: 0 };

  await pool.query("DELETE FROM precio_marcador WHERE origen = 'RELLENO'");

  const fechas = rows.map((r) => r.fecha);
  const precios = rows.map((r) => Number(r.precio));
  const existentes = new Set(fechas);
  const inicio = fechas[0];
  const fin = fechas[fechas.length - 1];

  let rellenados = 0;
  for (let dia = inicio; dia <= fin; dia = addDias(dia, 1)) {
    if (existentes.has(dia)) continue;
    const antes = [];
    const despues = [];
    for (let k = 0; k < fechas.length; k += 1) {
      if (fechas[k] < dia) antes.push(precios[k]);
      else if (fechas[k] > dia) {
        despues.push(precios[k]);
        if (despues.length >= 3) break;
      }
    }
    const vals = [...antes.slice(-3), ...despues];
    if (!vals.length) continue;
    const prom = vals.reduce((s, v) => s + v, 0) / vals.length;
    await pool.query(
      `INSERT INTO precio_marcador (fecha, precio, origen)
       VALUES ($1, $2, 'RELLENO')
       ON CONFLICT (fecha) DO UPDATE SET
         precio = EXCLUDED.precio, origen = 'RELLENO', actualizado_en = now()`,
      [dia, r2(prom)],
    );
    rellenados += 1;
  }
  return { total: rows.length, rellenados };
}

// Aplica el precio marcador por fecha a combustibles y detalles.
export async function aplicarPrecioMarcador() {
  const c = await pool.query(
    `UPDATE combustibles c SET us_precio_marcador = p.precio, actualizado_en = now()
     FROM precio_marcador p WHERE c.fecha = p.fecha`,
  );
  const d = await pool.query(
    `UPDATE detalles d SET us_precio_marcador = p.precio, actualizado_en = now()
     FROM precio_marcador p WHERE d.fecha = p.fecha`,
  );
  return { combustibles: c.rowCount, detalles: d.rowCount };
}

export async function listarPrecioMarcador() {
  const { rows } = await pool.query(
    `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, precio, origen
     FROM precio_marcador ORDER BY fecha`,
  );
  return rows;
}

export async function buscarPrecioMarcador(fecha) {
  if (!fecha) return null;
  const f = toFecha(fecha);
  if (!f) return null;
  const { rows } = await pool.query('SELECT precio FROM precio_marcador WHERE fecha = $1', [f]);
  return rows.length ? Number(rows[0].precio) : null;
}
