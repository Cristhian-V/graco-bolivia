import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { config } from '../config.js';

// ==================== HASH DE CONTRASEÑA ====================

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  try {
    const test = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return expected.length === test.length && timingSafeEqual(test, expected);
  } catch {
    return false;
  }
}

// ==================== JWT ====================

export function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), usuario: user.usuario, rol: user.rol },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

// ==================== CUENTAS ====================

export async function findUserByUsuario(usuario) {
  const { rows } = await pool.query(
    'SELECT id, usuario, password_hash, rol, activo FROM usuarios WHERE usuario = $1',
    [usuario],
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, usuario, rol, activo FROM usuarios WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

// Crea la cuenta admin por defecto si no existe.
export async function ensureAdmin() {
  if (!config.jwtSecret) {
    console.error('[auth] JWT_SECRET no está definido en el entorno');
    return;
  }
  const { rows } = await pool.query("SELECT 1 FROM usuarios WHERE usuario = 'admin'");
  if (rows.length > 0) return;
  if (!config.adminPassword) {
    console.error('[auth] ADMIN_PASSWORD no está definido; no se crea la cuenta admin');
    return;
  }
  await pool.query(
    "INSERT INTO usuarios (usuario, password_hash, rol) VALUES ('admin', $1, 'admin')",
    [hashPassword(config.adminPassword)],
  );
  console.log('[auth] cuenta admin creada (rol=admin)');
}
