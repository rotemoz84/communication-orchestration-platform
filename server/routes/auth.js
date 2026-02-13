/**
 * Auth Routes
 * Login / logout / current user for admin site
 */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const adminUserRepository = require('../dal/repositories/adminUserRepository');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await adminUserRepository.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.displayName = user.display_name || user.email;

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: req.session.displayName
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err.message);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

/**
 * GET /api/auth/me
 * Current user (for frontend to check login state). 401 if not logged in.
 */
router.get('/me', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated', code: 'LOGIN_REQUIRED' });
    }
    res.json({
        user: {
            id: req.session.userId,
            email: req.session.email,
            displayName: req.session.displayName
        }
    });
});

module.exports = router;
