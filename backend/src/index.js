import express from 'express';
import cron from 'node-cron';
import { initSchema, pool } from './db.js';
import { config } from './config.js';
import api from './routes/api.js';
import { guardApi } from './middleware/auth.js';
import { ensureAdmin } from './services/authService.js';
import { executeManifiestosRun } from './services/manifiestosService.js';
import { executeCombustiblesRun } from './services/combustiblesService.js';
import { actualizarTipoCambioRango, sincronizarTipoCambioCombustibles } from './services/tipoCambioService.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', guardApi);
app.use('/api', api);

app.use((err, req, res, next) => {
  console.error('[api] error:', err);
  res.status(500).json({ error: 'Error interno', detalle: String(err.message || err) });
});

const TZ = process.env.SCHEDULER_TZ || 'America/La_Paz';

function fechaLocal(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function horaLocal(d = new Date()) {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', hour12: false,
  }).format(d));
}

function rangoMes() {
  const hasta = fechaLocal();
  const desde = `${hasta.slice(0, 7)}-01`;
  return { desde, hasta };
}

function horaProgramada(expr) {
  const partes = String(expr || '').trim().split(/\s+/);
  const h = partes.length >= 2 ? parseInt(partes[1], 10) : NaN;
  return Number.isInteger(h) ? h : 0;
}

let corriendo = false;

async function correrCadena(motivo) {
  if (corriendo) {
    console.log(`[scheduler] ya hay una corrida en curso; se omite (${motivo})`);
    return;
  }
  corriendo = true;
  console.log(`[scheduler] iniciando corrida (${motivo})`);
  const { desde, hasta } = rangoMes();
  try {
    console.log('[scheduler] manifiestos OK:', await executeManifiestosRun({ desde, hasta }));
  } catch (e) {
    console.error('[scheduler] manifiestos fallida:', e.message);
  }
  try {
    console.log('[scheduler] tipo cambio OK:', await actualizarTipoCambioRango(desde, fechaLocal()));
  } catch (e) {
    console.error('[scheduler] tipo cambio fallida:', e.message);
  }
  try {
    console.log('[scheduler] sync tipo cambio combustibles OK:', await sincronizarTipoCambioCombustibles());
  } catch (e) {
    console.error('[scheduler] sync tipo cambio fallida:', e.message);
  }
  try {
    console.log('[scheduler] combustibles OK:', await executeCombustiblesRun({}));
  } catch (e) {
    console.error('[scheduler] combustibles fallida:', e.message);
  } finally {
    corriendo = false;
  }
}

async function corridaHechaHoy() {
  const { rows } = await pool.query(
    `SELECT 1 FROM ejecuciones
     WHERE (iniciado_en AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
     LIMIT 1`,
    [TZ],
  );
  return rows.length > 0;
}

// Dispara la cadena diaria si ya pasó la hora programada y hoy no corrió.
async function intentarCatchUp(motivo) {
  try {
    const hora = horaLocal();
    const programada = horaProgramada(config.cron);
    if (hora < programada) return;
    if (await corridaHechaHoy()) return;
    console.log(`[scheduler] sin corrida hoy y ya pasó las ${programada}:00 (${TZ}); catch-up (${motivo})`);
    await correrCadena(`catch-up:${motivo}`);
  } catch (e) {
    console.error('[scheduler] catch-up falló:', e.message);
  }
}

async function main() {
  const applied = await initSchema();
  console.log(`[init] esquema aplicado (${applied} archivos sql)`);

  await ensureAdmin();

  await pool.query(
    `UPDATE ejecuciones SET estado = 'ERROR', mensaje = 'interrumpido', finalizado_en = now()
     WHERE estado = 'EN_PROCESO'`,
  );
  console.log('[init] ejecuciones EN_PROCESO marcadas como interrumpidas');

  cron.schedule(config.cron, () => intentarCatchUp('cron'), { timezone: TZ });
  console.log(`[scheduler] registrado (cron: ${config.cron}, TZ: ${TZ})`);

  // Red de seguridad: cubre una suspensión/reinicio que pase por encima de la hora.
  setInterval(() => intentarCatchUp('intervalo'), 10 * 60 * 1000);

  // Recupera la corrida del día si el backend arranca después de la hora programada.
  intentarCatchUp('arranque').catch((e) => console.error('[scheduler] arranque:', e.message));

  app.listen(config.port, () => console.log(`[server] backend en :${config.port}`));
}

main().catch((e) => {
  console.error('[init] error fatal:', e);
  process.exit(1);
});
