import XLSX from 'xlsx';
import { pool } from '../db.js';

const HOJA = 'consolidado';

const CAMPOS = {
  id: ['id'],
  lote: ['lote'],
  nro_documento: ['no en documento', 'nro en documento', 'numero en documento', 'n en documento', 'nro. en documento'],
  pais_origen: ['pais de origen'],
  origen: ['origen'],
  frontera: ['frontera'],
  municipio_frontera: ['municipio frontera'],
  destino: ['destino'],
  municipio_destino: ['municipio destino'],
  tarifa_bob_m3: ['tarifa fija (bs/m3)', 'tarifa fija bs/m3'],
};

const ETIQUETAS = {
  id: 'ID',
  lote: 'Lote',
  nro_documento: 'N° en documento',
  pais_origen: 'País de origen',
  origen: 'Origen',
  frontera: 'Frontera',
  municipio_frontera: 'Municipio frontera',
  destino: 'Destino',
  municipio_destino: 'Municipio destino',
  tarifa_bob_m3: 'Tarifa fija (Bs/m3)',
};

function normKey(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/³/g, '3')
    .replace(/[°º]/g, 'o')
    .replace(/\s+/g, ' ')
    .trim();
}

function texto(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function parseNumero(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  const s = texto(v);
  if (!s) return NaN;
  let t = s.replace(/[^\d.,-]/g, '');
  if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.');
  else if (t.includes(',')) t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function rutaKey(r) {
  return [
    r.pais_origen, r.origen, r.frontera, r.municipio_frontera, r.destino, r.municipio_destino,
  ].join('|');
}

function fechaISO(v) {
  if (v == null) return null;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

function mapTarifa(r) {
  return {
    ...r,
    id_excel: r.id_excel == null ? null : Number(r.id_excel),
    nro_documento: r.nro_documento == null ? null : Number(r.nro_documento),
    tarifa_bob_m3: r.tarifa_bob_m3 == null ? null : Number(r.tarifa_bob_m3),
    vigente_desde: fechaISO(r.vigente_desde),
  };
}

// Lee la hoja "Consolidado" y devuelve las rutas válidas y los errores por fila.
export function leerTarifasExcel(buffer) {
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new Error('No se pudo leer el archivo. Debe ser un Excel (.xlsx) válido.');
  }
  const nombre = wb.SheetNames.find((n) => normKey(n) === HOJA);
  if (!nombre) throw new Error('Hoja "Consolidado" no encontrada en el archivo');
  const ws = wb.Sheets[nombre];
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  if (!matriz.length) throw new Error('La hoja "Consolidado" está vacía');

  const headers = (matriz[0] || []).map(normKey);
  const idx = {};
  for (const [campo, aliases] of Object.entries(CAMPOS)) {
    const pos = headers.findIndex((h) => aliases.includes(h));
    if (pos >= 0) idx[campo] = pos;
  }
  const faltantes = Object.keys(CAMPOS).filter((c) => idx[c] == null);
  if (faltantes.length) {
    throw new Error(`Faltan columnas obligatorias: ${faltantes.map((c) => ETIQUETAS[c]).join(', ')}`);
  }

  const registros = [];
  const errores = [];
  for (let fila = 1; fila < matriz.length; fila += 1) {
    const row = matriz[fila] || [];
    if (row.every((v) => v == null || String(v).trim() === '')) continue;
    const val = (c) => row[idx[c]];
    const r = {
      id_excel: parseNumero(val('id')),
      lote: texto(val('lote')) || null,
      nro_documento: parseNumero(val('nro_documento')),
      pais_origen: texto(val('pais_origen')),
      origen: texto(val('origen')),
      frontera: texto(val('frontera')),
      municipio_frontera: texto(val('municipio_frontera')),
      destino: texto(val('destino')),
      municipio_destino: texto(val('municipio_destino')),
      tarifa_bob_m3: parseNumero(val('tarifa_bob_m3')),
    };
    if (!r.pais_origen || !r.origen || !r.destino) {
      errores.push({ fila: fila + 1, motivo: 'Falta país de origen, origen o destino' });
      continue;
    }
    if (!Number.isFinite(r.tarifa_bob_m3)) {
      errores.push({ fila: fila + 1, motivo: 'Tarifa fija no numérica' });
      continue;
    }
    r.id_excel = Number.isFinite(r.id_excel) ? Math.trunc(r.id_excel) : null;
    r.nro_documento = Number.isFinite(r.nro_documento) ? Math.trunc(r.nro_documento) : null;
    r.tarifa_bob_m3 = Number(r.tarifa_bob_m3.toFixed(2));
    registros.push(r);
  }
  return { registros, errores };
}

async function ultimaVersion(menorQue = null) {
  const { rows } = menorQue
    ? await pool.query('SELECT max(vigente_desde) AS v FROM tarifas_flete_ypfb WHERE vigente_desde < $1', [menorQue])
    : await pool.query('SELECT max(vigente_desde) AS v FROM tarifas_flete_ypfb');
  return rows[0] ? rows[0].v : null;
}

// Compara el Excel con la última versión activa.
export async function previsualizarTarifas(buffer) {
  const { registros, errores } = leerTarifasExcel(buffer);
  const version = await ultimaVersion();
  let previos = [];
  if (version) {
    const { rows } = await pool.query(
      'SELECT * FROM tarifas_flete_ypfb WHERE vigente_desde = $1 AND activo = true',
      [version],
    );
    previos = rows.map(mapTarifa);
  }
  const previoMap = new Map(previos.map((r) => [rutaKey(r), r]));
  const nuevas = [];
  const actualizadas = [];
  const sinCambio = [];
  const vistos = new Set();

  for (const r of registros) {
    const k = rutaKey(r);
    vistos.add(k);
    const p = previoMap.get(k);
    if (!p) nuevas.push(r);
    else if (Number(p.tarifa_bob_m3) !== r.tarifa_bob_m3) {
      actualizadas.push({ ...r, tarifa_anterior: Number(p.tarifa_bob_m3) });
    } else {
      sinCambio.push(r);
    }
  }
  const aDesactivar = previos.filter((r) => !vistos.has(rutaKey(r)));

  return {
    version_anterior: fechaISO(version),
    total: registros.length,
    nuevas: nuevas.length,
    actualizadas: actualizadas.length,
    sin_cambio: sinCambio.length,
    a_desactivar: aDesactivar.length,
    errores,
    detalle: { nuevas, actualizadas, a_desactivar: aDesactivar },
    registros,
  };
}

const INSERT_SQL = `
INSERT INTO tarifas_flete_ypfb
  (id_excel, lote, nro_documento, pais_origen, origen, frontera, municipio_frontera,
   destino, municipio_destino, tarifa_bob_m3, vigente_desde, activo)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
`;

function limpiarRegistro(r) {
  const limpio = {
    id_excel: Number.isFinite(Number(r.id_excel)) ? Math.trunc(Number(r.id_excel)) : null,
    lote: texto(r.lote) || null,
    nro_documento: Number.isFinite(Number(r.nro_documento)) ? Math.trunc(Number(r.nro_documento)) : null,
    pais_origen: texto(r.pais_origen),
    origen: texto(r.origen),
    frontera: texto(r.frontera),
    municipio_frontera: texto(r.municipio_frontera),
    destino: texto(r.destino),
    municipio_destino: texto(r.municipio_destino),
    tarifa_bob_m3: Number(r.tarifa_bob_m3),
  };
  if (!limpio.pais_origen || !limpio.origen || !limpio.destino) {
    throw new Error('Hay una ruta sin país de origen, origen o destino');
  }
  if (!Number.isFinite(limpio.tarifa_bob_m3) || limpio.tarifa_bob_m3 < 0) {
    throw new Error('Hay una tarifa inválida');
  }
  limpio.tarifa_bob_m3 = Number(limpio.tarifa_bob_m3.toFixed(2));
  return limpio;
}

function valoresInsert(r, fecha, activo) {
  return [
    r.id_excel, r.lote, r.nro_documento, r.pais_origen, r.origen, r.frontera,
    r.municipio_frontera, r.destino, r.municipio_destino, r.tarifa_bob_m3, fecha, activo,
  ];
}

// Aplica una versión completa: activas del Excel + inactivas de la versión anterior.
export async function aplicarTarifas({ vigente_desde, registros } = {}) {
  const fecha = String(vigente_desde || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Fecha de vigencia inválida');
  if (!Array.isArray(registros) || registros.length === 0) {
    throw new Error('No hay registros para aplicar');
  }
  const limpios = registros.map(limpiarRegistro);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: previos } = await client.query(
      `SELECT * FROM tarifas_flete_ypfb
       WHERE vigente_desde = (
         SELECT max(vigente_desde) FROM tarifas_flete_ypfb WHERE vigente_desde < $1
       ) AND activo = true`,
      [fecha],
    );
    await client.query('DELETE FROM tarifas_flete_ypfb WHERE vigente_desde = $1', [fecha]);
    for (const r of limpios) {
      await client.query(INSERT_SQL, valoresInsert(r, fecha, true));
    }
    const presentes = new Set(limpios.map(rutaKey));
    let inactivos = 0;
    for (const p of previos) {
      if (presentes.has(rutaKey(p))) continue;
      const row = mapTarifa(p);
      await client.query(INSERT_SQL, valoresInsert(row, fecha, false));
      inactivos += 1;
    }
    await client.query('COMMIT');
    return { vigente_desde: fecha, activos: limpios.length, inactivos };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

function filtrosTarifas(query) {
  const conditions = [];
  const values = [];
  let i = 1;
  for (const [q, col] of [
    ['pais', 'pais_origen'],
    ['origen', 'origen'],
    ['frontera', 'frontera'],
    ['destino', 'destino'],
    ['lote', 'lote'],
  ]) {
    const v = texto(query[q]);
    if (v) {
      conditions.push(`${col} = $${i}`);
      values.push(v);
      i += 1;
    }
  }
  if (query.estado === 'inactivos') conditions.push('activo = false');
  else if (query.estado !== 'todos') conditions.push('activo = true');
  return { conditions, values, i };
}

export async function getTarifas(query = {}) {
  const fecha = texto(query.fecha).slice(0, 10);
  const version = fecha
    ? await ultimaVersionHasta(fecha)
    : await ultimaVersion();
  if (!version) {
    return {
      vigente_desde: null,
      tarifas: [],
      resumen_pais: [],
      resumen_frontera: [],
      versiones: await getVersiones(),
    };
  }
  const { conditions, values, i } = filtrosTarifas(query);
  conditions.unshift(`vigente_desde = $${i}`);
  values.push(version);
  const where = conditions.join(' AND ');

  const [{ rows }, { rows: porPais }, { rows: porFrontera }, versiones] = await Promise.all([
    pool.query(
      `SELECT * FROM tarifas_flete_ypfb WHERE ${where}
       ORDER BY pais_origen, origen, frontera, destino, municipio_destino`,
      values,
    ),
    pool.query(
      `SELECT pais_origen, count(*)::int AS tramos,
         min(tarifa_bob_m3) AS tarifa_min, max(tarifa_bob_m3) AS tarifa_max,
         round(avg(tarifa_bob_m3), 2) AS tarifa_promedio,
         string_agg(DISTINCT origen, ', ' ORDER BY origen) AS origenes
       FROM tarifas_flete_ypfb WHERE ${where}
       GROUP BY pais_origen ORDER BY pais_origen`,
      values,
    ),
    pool.query(
      `SELECT pais_origen, origen, frontera, count(*)::int AS tramos,
         min(tarifa_bob_m3) AS tarifa_min, max(tarifa_bob_m3) AS tarifa_max
       FROM tarifas_flete_ypfb WHERE ${where}
       GROUP BY pais_origen, origen, frontera
       ORDER BY pais_origen, origen, frontera`,
      values,
    ),
    getVersiones(),
  ]);

  const num = (r) => ({
    ...r,
    tarifa_min: r.tarifa_min == null ? null : Number(r.tarifa_min),
    tarifa_max: r.tarifa_max == null ? null : Number(r.tarifa_max),
    tarifa_promedio: r.tarifa_promedio == null ? null : Number(r.tarifa_promedio),
  });

  return {
    vigente_desde: fechaISO(version),
    tarifas: rows.map(mapTarifa),
    resumen_pais: porPais.map(num),
    resumen_frontera: porFrontera.map(num),
    versiones,
  };
}

async function ultimaVersionHasta(fecha) {
  const { rows } = await pool.query(
    'SELECT max(vigente_desde) AS v FROM tarifas_flete_ypfb WHERE vigente_desde <= $1',
    [fecha],
  );
  return rows[0] ? rows[0].v : null;
}

export async function getVersiones() {
  const { rows } = await pool.query(
    `SELECT vigente_desde, count(*)::int AS rutas,
       count(*) FILTER (WHERE activo)::int AS activas
     FROM tarifas_flete_ypfb
     GROUP BY vigente_desde ORDER BY vigente_desde DESC`,
  );
  return rows.map((r) => ({ ...r, vigente_desde: fechaISO(r.vigente_desde) }));
}

// Rutas activas de la última versión cargada (vigencia actual).
export async function getTarifasActuales() {
  const version = await ultimaVersion();
  if (!version) return { vigente_desde: null, tarifas: [] };
  const { rows } = await pool.query(
    `SELECT * FROM tarifas_flete_ypfb
     WHERE vigente_desde = $1 AND activo = true
     ORDER BY pais_origen, origen, frontera, destino`,
    [version],
  );
  return { vigente_desde: fechaISO(version), tarifas: rows.map(mapTarifa) };
}

// Rutas activas de la última versión vigente a la fecha indicada.
export async function getTarifasVigentes(fecha) {
  const version = await ultimaVersionHasta(fecha);
  if (!version) return { vigente_desde: null, tarifas: [] };
  const { rows } = await pool.query(
    `SELECT * FROM tarifas_flete_ypfb
     WHERE vigente_desde = $1 AND activo = true
     ORDER BY pais_origen, origen, frontera, destino`,
    [version],
  );
  return { vigente_desde: fechaISO(version), tarifas: rows.map(mapTarifa) };
}

export async function getTipoCambioHoy() {
  const { rows } = await pool.query(
    'SELECT fecha, valor FROM tipo_cambio WHERE fecha <= CURRENT_DATE ORDER BY fecha DESC LIMIT 1',
  );
  if (!rows.length) return { fecha: null, valor: null };
  return { fecha: fechaISO(rows[0].fecha), valor: Number(rows[0].valor) };
}
