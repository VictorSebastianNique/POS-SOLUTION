function requireAdmin(req, res, next) {
  // TODO: Phase 3 implementation
  next();
}

function requireSuperAdmin(req, res, next) {
  // TODO: Phase 3 implementation
  next();
}

module.exports = {
  requireAdmin,
  requireSuperAdmin
};
