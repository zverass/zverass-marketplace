export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }

    next();
  };
};

export const isSeller = (req, res, next) => {
  if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Only sellers can access this' });
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can access this' });
  }
  next();
};
