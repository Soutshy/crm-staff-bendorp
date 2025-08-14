import jwt from 'jsonwebtoken';

export const ROLES = {
  GERANT: 'GERANT',
  RESPONSABLE_STAFF: 'RESPONSABLE_STAFF',
  ADMINISTRATEUR: 'ADMINISTRATEUR',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé: rôle insuffisant' });
    }
    next();
  };
}
