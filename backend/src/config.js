import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  suma: {
    usuario: process.env.SUMA_USUARIO || '',
    password: process.env.SUMA_PASSWORD || '',
    baseUrl: process.env.SUMA_BASE_URL || 'https://suma.aduana.gob.bo',
    declaranteNit: process.env.SUMA_DECLARANTE_NIT || '1015517026',
  },
  serviciosBaseUrl: process.env.SUMA_SERVICIOS_URL || 'https://servicios.aduana.gob.bo',
  downloadsDir: process.env.DOWNLOADS_DIR || '/app/downloads',
  documentosDespachoDir: process.env.DOCUMENTOS_DESPACHO_DIR || '/app/documentos-despacho',
  fechaDesde: process.env.PRM_FECHA_DESDE || '2026-01-01',
  cron: process.env.SCHEDULER_CRON || '0 15 * * *',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  db: {
    host: process.env.PGHOST || 'db',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'prm',
    password: process.env.PGPASSWORD || 'prm',
    database: process.env.PGDATABASE || 'prm',
  },
  sqlDir: process.env.SQL_DIR || '/app/sql',
  pageSize: Number(process.env.PAGE_SIZE || 100),
  delayMs: Number(process.env.DELAY_MS || 500),
};
