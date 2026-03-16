/**
 * Auth Routes
 * Login / logout / current user for admin site
 * Cron login: establish session via secret for server-side cron jobs
 */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const adminUserRepository = require('../dal/repositories/adminUserRepository');
const { config } = require('../config');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Do not log req.body or password; payload is visible in DevTools but sent over HTTPS only.
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

        // Save session to store before sending response so the next request sees it (avoids race)
        req.session.save((err) => {
            if (err) {
                console.error('Session save error on login:', err.message);
                return res.status(500).json({ error: 'Login failed' });
            }
            if (process.env.NODE_ENV === 'production') {
                console.log('Auth: login success userId=' + user.id);
            }
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: req.session.displayName
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/cron-login
 * For cron jobs: authenticate with CRON_SECRET to get a real session, then call
 * e.g. POST /api/inquiries/send-summary with the returned cookie.
 * Secret via header X-Cron-Secret or body { cronSecret: "..." }.
 * Uses CRON_ADMIN_EMAIL to pick which admin user the session is for.
 */
router.post('/cron-login', async (req, res) => {
    try {
        const secret = req.get('X-Cron-Secret') || req.body?.cronSecret;
        if (!secret || !config.cron?.secret || secret !== config.cron.secret) {
            return res.status(401).json({ error: 'Invalid cron secret' });
        }
        const adminEmail = config.cron.adminEmail;
        if (!adminEmail) {
            return res.status(500).json({ error: 'CRON_ADMIN_EMAIL not configured' });
        }
        const user = await adminUserRepository.findByEmail(adminEmail);
        if (!user) {
            return res.status(401).json({ error: 'Cron admin user not found' });
        }
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.displayName = user.display_name || user.email;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error on cron-login:', err.message);
                return res.status(500).json({ error: 'Cron login failed' });
            }
            if (process.env.NODE_ENV === 'production') {
                console.log('Auth: cron-login success userId=' + user.id);
            }
            res.json({ success: true, message: 'Session created; use cookie for next request' });
        });
    } catch (error) {
        console.error('Cron login error:', error.message);
        res.status(500).json({ error: 'Cron login failed' });
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
 * Current user (for frontend to check login state). 200 + { user: null } when not logged in
 * (avoids browser console "Failed to load resource" for 401).
 */
router.get('/me', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(200).json({ user: null });
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
