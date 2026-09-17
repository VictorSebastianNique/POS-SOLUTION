const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET env variable not set. Set a strong random secret in Render environment variables.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'cafeteria-pos-secret-2024-fallback';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token de acceso no proporcionado o formato inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token expirado o inválido' });
  }
};

// Middleware para verificar roles específicos
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Acceso denegado: permisos insuficientes' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET
};
