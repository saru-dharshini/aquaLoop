/**
 * Content-Type Negotiation Middleware — AquaLoop Phase 2
 *
 * Enforces JSON media type on state-changing API requests.
 * Blocks form-based URL-encoded submissions to mitigate CSRF vectors.
 */

/**
 * Middleware: Enforces Content-Type: application/json for state-changing requests (POST, PUT, PATCH)
 * Returns 415 Unsupported Media Type if a non-JSON body is supplied.
 */
export function requireJsonContent(req, res, next) {
  const isStateChanging = ['POST', 'PUT', 'PATCH'].includes(req.method)
  if (!isStateChanging) {
    return next()
  }

  const contentType = req.headers['content-type']
  const contentLength = req.headers['content-length']

  // If there is explicitly no body (e.g. POST /logout with 0 content-length), permit it
  if (contentLength === '0' || (!contentLength && !contentType && Object.keys(req.body || {}).length === 0)) {
    return next()
  }

  // If a body is present or indicated, Content-Type must be application/json
  if (!contentType || !contentType.toLowerCase().includes('application/json')) {
    return res.status(415).json({
      error: 'Unsupported Media Type: Request Content-Type must be application/json.',
    })
  }

  next()
}
