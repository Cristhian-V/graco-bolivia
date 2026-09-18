import { Router } from 'express';
import express from 'express';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { pool } from '../db.js';
import { executeManifiestosRun } from '../services/manifiestosService.js';
import { executeCombustiblesRun } from '../services/combustiblesService.js';
import { getDashboardFilters, getDashboardKpis, getDashboardData, seedDetallesDesdeExcel, upsertDetalle } from '../services/presentacionService.js';
import { actualizarTipoCambioRango, sincronizarTipoCambioCombustibles } from '../services/tipoCambioService.js';
import {
  leerPrecioMarcador,
  procesarPrecioMarcador,
  rellenarPrecioMarcador,
  aplicarPrecioMarcador,
  listarPrecioMarcador,
} from '../services/precioMarcadorService.js';
import { signToken, verifyPassword, findUserByUsuario, hashPassword } from '../services/authService.js';
import { config } from '../config.js';

const router = Router();

const TOKEN_COOKIE = 'token';

function expiresInMs(s) {
  const m = /^(\d+)([smhd])$/.exec(String(s || ''));
  if (!m) return 8 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]] || 3600000;
  return n * unit;
}

// ==================== AUTENTICACIÓN ====================

router.post('/auth/login', async (req, res, next) => {
  try {
    const { usuario, password } = req.body || {};
    if (!usuario || !password) {
      return res.status(400).json({ error: 'usuario y password son requeridos' });
    }
    const user = await findUserByUsuario(usuario);
    if (!user || !user.activo || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = signToken(user);
    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInMs(config.jwtExpiresIn),
    });
    res.json({ usuario: user.usuario, rol: user.rol });
  } catch (e) {
    next(e);
  }
});

router.get('/auth/me', (req, res) => {
  res.json({ usuario: req.user.usuario, rol: req.user.rol });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ==================== USUARIOS (solo admin) ====================

router.get('/usuarios', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, usuario, rol, activo, creado_en FROM usuarios ORDER BY usuario',
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/usuarios', async (req, res, next) => {
  try {
    const { usuario, password, rol } = req.body || {};
    if (!usuario || !password) {
      return res.status(400).json({ error: 'usuario y password son requeridos' });
    }
    if (rol !== 'admin' && rol !== 'presentacion') {
      return res.status(400).json({ error: 'rol inválido (admin o presentacion)' });
    }
    const { rows } = await pool.query(
      'INSERT INTO usuarios (usuario, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, usuario, rol, activo',
      [String(usuario), hashPassword(String(password)), rol],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }
    next(e);
  }
});

router.put('/usuarios/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { usuario, password, rol, activo } = req.body || {};
    const sets = [];
    const values = [];
    let i = 1;

    if (usuario != null && usuario !== '') {
      sets.push(`usuario = $${i++}`);
      values.push(String(usuario));
    }
    if (password != null && password !== '') {
      sets.push(`password_hash = $${i++}`);
      values.push(hashPassword(String(password)));
    }
    if (rol != null) {
      if (rol !== 'admin' && rol !== 'presentacion') {
        return res.status(400).json({ error: 'rol inválido (admin o presentacion)' });
      }
      sets.push(`rol = $${i++}`);
      values.push(rol);
    }
    if (activo != null) {
      sets.push(`activo = $${i++}`);
      values.push(Boolean(activo));
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, usuario, rol, activo`,
      values,
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }
    next(e);
  }
});

// ==================== COMBUSTIBLES / REFERENCIAS / ETC. ====================

const COLUMNAS_COMBUSTIBLES = [
  'crt', 'uso', 'fecha', 'aduana', 'dim_dam', 'incoterm', 'producto', 'proveedor',
  'importador', 'transporte', 'cantidad_m3', 'tipo_cambio_dim', 'tramo_flete',
  'us_unitario', 'importador_nit', 'pais_procedencia', 'modalidad_despacho',
  'us_precio_marcador', 'fecha_factura_trans', 'flete_total_usd', 'flete_total_bs',
  'tipo_cambio_trans', 'tarifa_flete_usd_m3', 'tarifa_flete_bob_m3',
];

// Columnas editables desde el panel: todas las de negocio excepto la clave `dim_dam`
// (y sin `id`, `nit`, `run_id` ni `raw`).
const COLUMNAS_EDITABLES = COLUMNAS_COMBUSTIBLES.filter((c) => c !== 'dim_dam');

const COMBUSTIBLES_SELECT = ['id', 'nit', ...COLUMNAS_COMBUSTIBLES, 'tarifa_revisada', 'tarifa_revisada_valor'].join(', ');

const PENDIENTE_SQL = `(
  tipo_cambio_trans IS NULL
  OR us_unitario > 5000
  OR ((tarifa_flete_usd_m3 IS NULL OR tarifa_flete_usd_m3 > 150)
      AND NOT (tarifa_revisada AND tarifa_revisada_valor IS NOT DISTINCT FROM tarifa_flete_usd_m3))
)`;

const CAMPOS_NUMERICOS_EDIT = [
  'cantidad_m3', 'tipo_cambio_dim', 'us_unitario', 'us_precio_marcador',
  'flete_total_usd', 'flete_total_bs', 'tipo_cambio_trans',
  'tarifa_flete_usd_m3', 'tarifa_flete_bob_m3',
];

const CAMPOS_FECHA_EDIT = ['fecha', 'fecha_factura_trans'];

function numEdit(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function r2Edit(x) {
  if (x == null) return null;
  const n = Number(x);
  return Number.isNaN(n) ? null : Number(n.toFixed(2));
}

router.get('/clientes', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT nit, nombre, activo FROM clientes ORDER BY nombre',
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/aduanas', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT codigo_aduana, nombre FROM aduanas ORDER BY codigo_aduana',
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/aduanas', async (req, res, next) => {
  try {
    const { codigo_aduana, nombre, tipo, ciudad } = req.body || {};
    if (!codigo_aduana || !nombre) {
      return res.status(400).json({ error: 'codigo_aduana y nombre son requeridos' });
    }
    await pool.query(
      'INSERT INTO aduanas (codigo_aduana, nombre, tipo, ciudad) VALUES ($1, $2, $3, $4)',
      [String(codigo_aduana), String(nombre), tipo ?? null, ciudad ?? null],
    );
    res.status(201).json({ codigo_aduana, nombre, tipo, ciudad });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'El código de aduana ya existe' });
    }
    next(e);
  }
});

const TABLAS_REFERENCIA = {
  proveedores: { cols: ['nombre'], required: ['nombre'] },
  productos: { cols: ['nombre', 'nandina'], required: ['nombre'] },
  paises: { cols: ['nombre', 'codigo_iso2'], required: ['nombre'] },
  incoterms: { cols: ['codigo', 'descripcion'], required: ['codigo'] },
  transportes: { cols: ['nombre'], required: ['nombre'] },
  aduanas: { cols: ['codigo_aduana', 'nombre', 'tipo', 'ciudad'], required: ['codigo_aduana', 'nombre'] },
  clientes: { cols: ['nit', 'nombre', 'activo'], required: ['nit', 'nombre'], activo: true },
};

router.get('/referencias/:tabla', async (req, res, next) => {
  try {
    const tabla = req.params.tabla;
    const cfg = TABLAS_REFERENCIA[tabla];
    if (!cfg) return res.status(404).json({ error: 'Tabla no reconocida' });
    const { rows } = await pool.query(`SELECT ${cfg.cols.join(', ')} FROM ${tabla} ORDER BY ${cfg.cols[0]}`);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/referencias/:tabla', async (req, res, next) => {
  try {
    const tabla = req.params.tabla;
    const cfg = TABLAS_REFERENCIA[tabla];
    if (!cfg) return res.status(404).json({ error: 'Tabla no reconocida' });
    const body = req.body || {};
    for (const r of cfg.required) {
      if (body[r] == null || body[r] === '') {
        return res.status(400).json({ error: `Campo requerido: ${r}` });
      }
    }
    const values = cfg.cols.map((c) => (c === 'activo' ? cfg.activo : body[c] ?? null));
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO ${tabla} (${cfg.cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING *`,
      values,
    );
    if (rows.length === 0) return res.status(409).json({ error: 'El registro ya existe' });
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get('/manifiestos', async (req, res, next) => {
  try {
    const nit = req.query.nit;
    let rows;
    if (nit) {
      rows = (
        await pool.query(
          'SELECT * FROM manifiestos WHERE nit = $1 ORDER BY fecha DESC NULLS LAST, correlativo',
          [nit],
        )
      ).rows;
    } else {
      rows = (
        await pool.query('SELECT * FROM manifiestos ORDER BY nit, correlativo')
      ).rows;
    }
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/manifiestos/:id/archivo', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT ruta_archivo, nombre_archivo FROM manifiestos WHERE id = $1',
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Manifiesto no encontrado' });
    }
    const ruta = rows[0].ruta_archivo;
    if (!ruta) {
      return res.status(404).json({ error: 'Archivo no disponible' });
    }
    const abs = path.resolve(config.downloadsDir, ruta);
    res.download(abs, rows[0].nombre_archivo || path.basename(abs), (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (e) {
    next(e);
  }
});

router.post('/ejecutar-manifiestos', async (req, res, next) => {
  try {
    const { desde, hasta, nits } = req.body || {};
    const hoy = new Date().toISOString().slice(0, 10);
    const result = await executeManifiestosRun({
      desde: desde || config.fechaDesde,
      hasta: hasta || hoy,
      nits: Array.isArray(nits) ? nits : undefined,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/combustibles', async (req, res, next) => {
  try {
    const nit = req.query.nit;
    const mes = String(req.query.mes || '').trim();
    const tipo = req.query.tipo === 'pendientes' ? 'pendientes' : 'historial';
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(500, Math.max(1, parseInt(req.query.limite, 10) || 100));

    const base = [];
    const baseValues = [];
    if (nit) {
      base.push(`nit = $${baseValues.length + 1}`);
      baseValues.push(nit);
    }
    if (mes) {
      base.push(`to_char(fecha, 'YYYY-MM') = $${baseValues.length + 1}`);
      baseValues.push(mes);
    }
    const whereBase = base.length ? `WHERE ${base.join(' AND ')}` : '';
    const wherePend = base.length ? `WHERE ${base.join(' AND ')} AND ${PENDIENTE_SQL}` : `WHERE ${PENDIENTE_SQL}`;

    const [cHist, cPend] = await Promise.all([
      pool.query(`SELECT count(*)::int AS n FROM combustibles ${whereBase}`, baseValues),
      pool.query(`SELECT count(*)::int AS n FROM combustibles ${wherePend}`, baseValues),
    ]);
    const totalHistorial = cHist.rows[0].n;
    const totalPendientes = cPend.rows[0].n;
    const total = tipo === 'pendientes' ? totalPendientes : totalHistorial;
    const where = tipo === 'pendientes' ? wherePend : whereBase;

    const offset = (pagina - 1) * limite;
    const { rows } = await pool.query(
      `SELECT ${COMBUSTIBLES_SELECT} FROM combustibles ${where}
       ORDER BY fecha DESC NULLS LAST, dim_dam LIMIT $${baseValues.length + 1} OFFSET $${baseValues.length + 2}`,
      [...baseValues, limite, offset],
    );

    res.json({ total, totalHistorial, totalPendientes, pagina, limite, filas: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/combustibles/:id/documentos', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.* FROM documentos_despacho d
       JOIN combustibles c ON c.dim_dam = d.dim_dam
       WHERE c.id = $1 ORDER BY d.tipo`,
      [req.params.id],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/combustibles/:id/documentos/:docId/archivo', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT ruta_archivo, nombre_archivo, url FROM documentos_despacho WHERE id = $1',
      [req.params.docId],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });
    const { ruta_archivo: ruta, nombre_archivo: nombre, url } = rows[0];
    if (url) return res.redirect(url);
    if (!ruta) return res.status(404).json({ error: 'Archivo no disponible' });
    const abs = path.resolve(config.documentosDespachoDir, ruta);
    res.download(abs, nombre || path.basename(abs), (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (e) {
    next(e);
  }
});

router.put('/combustibles/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const { rows } = await pool.query('SELECT * FROM combustibles WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    const cur = rows[0];

    const merged = {};
    for (const col of COLUMNAS_EDITABLES) {
      if (Object.prototype.hasOwnProperty.call(body, col)) {
        const v = body[col];
        if (CAMPOS_NUMERICOS_EDIT.includes(col)) {
          merged[col] = r2Edit(v);
        } else if (CAMPOS_FECHA_EDIT.includes(col)) {
          merged[col] = v == null || v === '' ? null : String(v).slice(0, 10);
        } else {
          merged[col] = v == null ? null : String(v);
        }
      } else {
        merged[col] = cur[col];
      }
    }

    // Detecta qué campos fuente cambiaron para decidir qué derivadas recalcular.
    const cambia = (col) =>
      Object.prototype.hasOwnProperty.call(body, col) &&
      numEdit(body[col]) !== numEdit(cur[col]);

    const usdCambio = cambia('flete_total_usd');
    const tcCambio = cambia('tipo_cambio_trans');

    const usd = numEdit(merged.flete_total_usd);
    const tc = numEdit(merged.tipo_cambio_trans);
    const cant = numEdit(merged.cantidad_m3);

    // tarifa_flete_usd_m3 = flete_total_usd / cantidad_m3
    merged.tarifa_flete_usd_m3 = (usd != null && cant) ? r2Edit(usd / cant) : null;

    // flete_total_bs = flete_total_usd × tipo_cambio_trans (solo si cambió usd o tc)
    if (usdCambio || tcCambio) {
      merged.flete_total_bs = (usd != null && tc != null) ? r2Edit(usd * tc) : null;
    }

    // tarifa_flete_bob_m3 = flete_total_bs / cantidad_m3
    const bsFinal = numEdit(merged.flete_total_bs);
    merged.tarifa_flete_bob_m3 = (bsFinal != null && cant) ? r2Edit(bsFinal / cant) : null;

    const sets = [];
    const values = [];
    let i = 1;
    for (const col of COLUMNAS_EDITABLES) {
      sets.push(`${col} = $${i++}`);
      values.push(merged[col] ?? null);
    }
    sets.push('actualizado_en = now()');
    values.push(id);
    await pool.query(`UPDATE combustibles SET ${sets.join(', ')} WHERE id = $${i}`, values);

    const { rows: full } = await pool.query('SELECT * FROM combustibles WHERE id = $1', [id]);
    await upsertDetalle(full[0]);
    res.json(full[0]);
  } catch (e) {
    next(e);
  }
});

router.post('/combustibles/:id/ignorar', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE combustibles
       SET tarifa_revisada = true, tarifa_revisada_valor = tarifa_flete_usd_m3,
           actualizado_en = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get('/combustibles/export', async (req, res, next) => {
  try {
    const mes = req.query.mes; // opcional: YYYY-MM, aplica solo a "detalles"
    const wb = new ExcelJS.Workbook();

    const hojasRef = [
      { name: 'clientes', sql: 'SELECT nit, nombre FROM clientes ORDER BY nombre', cols: ['nit', 'nombre'] },
      { name: 'proveedores', sql: 'SELECT nombre FROM proveedores ORDER BY nombre', cols: ['nombre'] },
      { name: 'productos', sql: 'SELECT nombre, nandina FROM productos ORDER BY nombre', cols: ['nombre', 'nandina'] },
      { name: 'aduanas', sql: 'SELECT tipo, ciudad, codigo_aduana AS codigo, nombre FROM aduanas ORDER BY codigo_aduana', cols: ['tipo', 'ciudad', 'codigo', 'nombre'] },
      { name: 'paises', sql: 'SELECT nombre, codigo_iso2 FROM paises ORDER BY nombre', cols: ['nombre', 'codigo_iso2'] },
      { name: 'incoterms', sql: 'SELECT codigo, descripcion FROM incoterms ORDER BY codigo', cols: ['codigo', 'descripcion'] },
      { name: 'transportes', sql: 'SELECT nombre FROM transportes ORDER BY nombre', cols: ['nombre'] },
    ];

    for (const s of hojasRef) {
      const { rows } = await pool.query(s.sql);
      const ws = wb.addWorksheet(s.name);
      ws.columns = s.cols.map((c) => ({ header: c, key: c, width: 28 }));
      rows.forEach((r) => ws.addRow(r));
    }

    let sql = 'SELECT * FROM combustibles';
    const params = [];
    if (mes) {
      sql += " WHERE to_char(fecha, 'YYYY-MM') = $1";
      params.push(mes);
    }
    sql += ' ORDER BY fecha, dim_dam';
    const { rows } = await pool.query(sql, params);

    const ws = wb.addWorksheet('detalles');
    ws.columns = COLUMNAS_COMBUSTIBLES.map((col) => ({
      header: col,
      key: col,
      width: col === 'producto' || col === 'importador' || col === 'proveedor' || col === 'tramo_flete' ? 28 : 16,
    }));
    for (const r of rows) {
      const row = {};
      for (const col of COLUMNAS_COMBUSTIBLES) {
        let v = r[col];
        if ((col === 'fecha' || col === 'fecha_factura_trans') && v) {
          v = v.toISOString ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
        }
        row[col] = v ?? null;
      }
      ws.addRow(row);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="combustibles_export.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

router.post('/ejecutar-combustibles', async (req, res, next) => {
  try {
    const { nits, desde, hasta } = req.body || {};
    const result = await executeCombustiblesRun({
      nits: Array.isArray(nits) ? nits : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/tipo-cambio', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT fecha, valor, fuente FROM tipo_cambio ORDER BY fecha',
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/tipo-cambio/:fecha', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT fecha, valor, fuente FROM tipo_cambio WHERE fecha = $1',
      [req.params.fecha],
    );
    res.json(rows.length > 0 ? rows[0] : null);
  } catch (e) {
    next(e);
  }
});

router.post('/tipo-cambio/actualizar', async (req, res, next) => {
  try {
    const { desde, hasta } = req.body || {};
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'desde y hasta son requeridos (YYYY-MM-DD)' });
    }
    const result = await actualizarTipoCambioRango(desde, hasta);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/tipo-cambio/sincronizar-combustibles', async (req, res, next) => {
  try {
    res.json(await sincronizarTipoCambioCombustibles());
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/filters', async (req, res, next) => {
  try {
    res.json(await getDashboardFilters());
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/kpis', async (req, res, next) => {
  try {
    res.json(await getDashboardKpis(req.query));
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/data', async (req, res, next) => {
  try {
    res.json(await getDashboardData(req.query));
  } catch (e) {
    next(e);
  }
});

router.post(
  '/dashboard/seed',
  express.raw({
    type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
    limit: '50mb',
  }),
  async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Se espera un archivo .xlsx en el cuerpo de la petición' });
      }
      const result = await seedDetallesDesdeExcel(req.body);
      res.json({ ok: true, ...result });
    } catch (e) {
      next(e);
    }
  },
);

router.get('/precio-marcador', async (req, res, next) => {
  try {
    res.json(await listarPrecioMarcador());
  } catch (e) {
    next(e);
  }
});

router.post(
  '/precio-marcador/preview',
  express.raw({
    type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
    limit: '50mb',
  }),
  async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Se espera un archivo .xlsx en el cuerpo de la petición' });
      }
      res.json(await leerPrecioMarcador(req.body));
    } catch (e) {
      next(e);
    }
  },
);

router.post('/precio-marcador/procesar', async (req, res, next) => {
  try {
    const { registros } = req.body || {};
    res.json(await procesarPrecioMarcador(registros));
  } catch (e) {
    next(e);
  }
});

router.post('/precio-marcador/rellenar', async (req, res, next) => {
  try {
    res.json(await rellenarPrecioMarcador());
  } catch (e) {
    next(e);
  }
});

router.post('/precio-marcador/aplicar', async (req, res, next) => {
  try {
    res.json(await aplicarPrecioMarcador());
  } catch (e) {
    next(e);
  }
});

export default router;
