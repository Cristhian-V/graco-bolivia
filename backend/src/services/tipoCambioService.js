import { obtenerTipoCambioBcb } from '../scraper/bcb.js';
import { upsertDetalle } from './presentacionService.js';
import { pool } from '../db.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Tipo de cambio fijo para fechas anteriores a julio (sin cotización en el período actual).
const TC_PRE_JULIO = 6.96;

export async function buscarTipoCambio(fecha) {
  if (!fecha) return null;
  if (fecha < '2026-07-01') return TC_PRE_JULIO;
  const { rows } = await pool.query('SELECT valor FROM tipo_cambio WHERE fecha = $1', [fecha]);
  return rows.length > 0 ? Number(rows[0].valor) : null;
}

// Actualiza el tipo de cambio del BCB para un rango de fechas [desde, hasta] inclusive.
export async function actualizarTipoCambioRango(desde, hasta) {
  const cur = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  let actualizados = 0;
  let sinCotizacion = 0;
  let errores = 0;
  while (cur <= fin) {
    const fecha = cur.toISOString().slice(0, 10);
    try {
      const valor = await obtenerTipoCambioBcb(fecha);
      if (valor == null) {
        sinCotizacion += 1;
      } else {
        await pool.query(
          `INSERT INTO tipo_cambio (fecha, valor, fuente) VALUES ($1, $2, 'bcb')
           ON CONFLICT (fecha) DO UPDATE SET valor = EXCLUDED.valor, fuente = EXCLUDED.fuente, actualizado_en = now()`,
          [fecha, valor],
        );
        actualizados += 1;
      }
    } catch (e) {
      errores += 1;
      console.error(`[bcb] error ${fecha}: ${e.message}`);
    }
    cur.setDate(cur.getDate() + 1);
    await delay(200);
  }
  return { desde, hasta, actualizados, sinCotizacion, errores };
}

// Sincroniza el tipo de cambio de transporte de los combustibles que lo tienen
// nulo: asegura la cotización del BCB para su fecha de factura, la guarda en
// `tipo_cambio` y re-deriva `tipo_cambio_trans`, `flete_total_bs` y
// `tarifa_flete_bob_m3`, replicando los cambios a `detalles`.
export async function sincronizarTipoCambioCombustibles() {
  const { rows: faltantes } = await pool.query(
    `SELECT DISTINCT to_char(fecha_factura_trans, 'YYYY-MM-DD') AS fecha
     FROM combustibles
     WHERE tipo_cambio_trans IS NULL AND fecha_factura_trans IS NOT NULL
     ORDER BY fecha`,
  );

  let cotizaciones = 0;
  let sinCotizacion = 0;
  for (const { fecha } of faltantes) {
    const existe = await pool.query('SELECT 1 FROM tipo_cambio WHERE fecha = $1', [fecha]);
    if (existe.rows.length > 0) continue;
    try {
      const valor = await obtenerTipoCambioBcb(fecha);
      if (valor == null) {
        sinCotizacion += 1;
      } else {
        await pool.query(
          `INSERT INTO tipo_cambio (fecha, valor, fuente) VALUES ($1, $2, 'bcb')
           ON CONFLICT (fecha) DO UPDATE SET valor = EXCLUDED.valor, fuente = EXCLUDED.fuente, actualizado_en = now()`,
          [fecha, valor],
        );
        cotizaciones += 1;
      }
    } catch (e) {
      sinCotizacion += 1;
      console.error(`[sync-tc] error ${fecha}: ${e.message}`);
    }
    await delay(200);
  }

  const upd = await pool.query(
    `UPDATE combustibles c
     SET tipo_cambio_trans = tc.valor,
         flete_total_bs = CASE WHEN c.flete_total_usd IS NOT NULL
           THEN round((c.flete_total_usd * tc.valor)::numeric, 2) ELSE c.flete_total_bs END,
         tarifa_flete_bob_m3 = CASE WHEN c.flete_total_usd IS NOT NULL AND c.cantidad_m3 IS NOT NULL AND c.cantidad_m3 <> 0
           THEN round((c.flete_total_usd * tc.valor / c.cantidad_m3)::numeric, 2) ELSE c.tarifa_flete_bob_m3 END,
         actualizado_en = now()
     FROM tipo_cambio tc
     WHERE c.tipo_cambio_trans IS NULL
       AND c.fecha_factura_trans IS NOT NULL
       AND tc.fecha = c.fecha_factura_trans
     RETURNING c.id`,
  );

  for (const { id } of upd.rows) {
    const { rows } = await pool.query('SELECT * FROM combustibles WHERE id = $1', [id]);
    if (rows.length) await upsertDetalle(rows[0]);
  }

  return {
    fechasFaltantes: faltantes.length,
    cotizaciones,
    sinCotizacion,
    actualizados: upd.rowCount,
  };
}
