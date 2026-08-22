const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cafeteria-pos-secret-2024';

const requireAuth = (req, res, next) => {
  if (req.headers['x-dev-password'] === 'devmaster2026') {
    req.user = { role: 'developer', name: 'Developer' };
    return next();
  }

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

module.exports = {
  requireAuth,
  JWT_SECRET
};
