import { verifyToken } from '../services/authService.js';

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return part.slice(idx + 1).trim();
  }
  return null;
}

// Exige sesión válida: verifica el JWT de la cookie y adjunta req.user.
export function requireAuth(req, res, next) {
  const token = getCookie(req, 'token');
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

// Exige rol admin (requiere requireAuth previo).
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  return next();
}

// Guardia general de /api:
// - POST /auth/login es público.
// - El resto exige sesión; /auth/* y /dashboard/* para cualquier rol,
//   y todo lo demás solo para admin.
export function guardApi(req, res, next) {
  if (req.path === '/auth/login') return next();
  return requireAuth(req, res, () => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/dashboard')) return next();
    return requireAdmin(req, res, next);
  });
}
