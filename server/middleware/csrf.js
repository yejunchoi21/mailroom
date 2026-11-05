const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next()
  }

  if (!req.session) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  const headerToken = req.get('x-csrf-token')
  if (!headerToken || headerToken !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token.' })
  }

  return next()
}
