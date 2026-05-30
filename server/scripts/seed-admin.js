/**
 * Seed first admin user (run once).
 * Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then:
 *   node scripts/seed-admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { initDatabase } = require('../dal');
const adminUserRepository = require('../dal/repositories/adminUserRepository');

async function seed() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('ADMIN_PASSWORD must be at least 8 characters');
        process.exit(1);
    }

    await initDatabase();

    const existing = await adminUserRepository.findByEmail(email);
    if (existing) {
        console.log('Admin user already exists');
        process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await adminUserRepository.create({
        email,
        passwordHash,
        displayName: email.split('@')[0]
    });

    console.log('Admin user created');
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
