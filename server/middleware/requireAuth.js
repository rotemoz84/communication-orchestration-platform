/**
 * Require authenticated admin session.
 * Use on routes that must be protected.
 * Returns 401 JSON if not logged in.
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    if (process.env.NODE_ENV === 'production') {
        console.log('Auth: 401 no session (sessionId=' + (req.sessionID || 'none') + ')');
    }
    res.status(401).json({ error: 'Unauthorized', code: 'LOGIN_REQUIRED' });
}

module.exports = { requireAuth };
