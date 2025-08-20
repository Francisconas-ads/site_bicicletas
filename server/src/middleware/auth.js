export function requireAdmin(req, res, next) {
  const header = req.headers['authorization'] || '';
  const viaHeader = header.startsWith('Bearer ') ? header.substring(7) : null;
  const viaKey = req.headers['x-admin-key'];
  const token = viaHeader || viaKey || '';
  const expected = process.env.ADMIN_TOKEN || 'changeme';
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

