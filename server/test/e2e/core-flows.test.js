const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const bcrypt = require('bcrypt');
const express = require('express');

const createdInquiries = [];
const createdBookings = [];
const sessions = new Map();
const restorers = [];

let appServer;
let baseUrl;
let nextSessionId = 1;

const bookingSettings = {
    meetingTypes: [
        { id: 'consultation', name: 'Consultation', duration: 30 }
    ],
    workingHours: {},
    settings: {
        advanceBookingDays: 30,
        timezone: 'Asia/Jerusalem',
        bufferTime: 0,
        minNoticeHours: 0
    },
    lastUpdated: '2026-05-27T00:00:00.000Z'
};

function replaceModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const priorModule = require.cache[resolvedPath];

    require.cache[resolvedPath] = {
        id: resolvedPath,
        filename: resolvedPath,
        loaded: true,
        exports
    };

    restorers.push(() => {
        if (priorModule) {
            require.cache[resolvedPath] = priorModule;
        } else {
            delete require.cache[resolvedPath];
        }
    });
}

function requireFresh(modulePath) {
    const resolvedPath = require.resolve(modulePath);
    delete require.cache[resolvedPath];
    return require(modulePath);
}

async function request(path, options = {}) {
    const response = await fetch(baseUrl + path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    return {
        response,
        body: await response.json()
    };
}

before(async () => {
    replaceModule('../../dal/repositories/inquiryRepository', {
        async create(inquiry) {
            createdInquiries.push(inquiry);
            return { inquiryId: `INQ-TEST-${createdInquiries.length}` };
        },
        async find() {
            return [{ inquiryId: 'INQ-TEST-1', phone: '0501234567', status: 'new' }];
        },
        async count() {
            return 1;
        },
        async findById() {
            return null;
        },
        async updateById() {
            return null;
        }
    });

    const passwordHash = bcrypt.hashSync('correct-password', 4);
    replaceModule('../../dal/repositories/adminUserRepository', {
        async findByEmail(email) {
            if (email !== 'admin@example.test') {
                return null;
            }
            return {
                id: 7,
                email,
                password_hash: passwordHash,
                display_name: 'Clinic Admin'
            };
        }
    });

    replaceModule('../../integrations/google/sheets', {
        async getBookingSettings() {
            return bookingSettings;
        },
        clearCache() {}
    });

    replaceModule('../../integrations/google/calendar', {
        async getAvailableSlots(date) {
            if (date !== '2026-06-15') {
                return [];
            }
            return [{
                start: '2026-06-15T09:00:00.000Z',
                time: '09:00'
            }];
        },
        async createBookingEvent(booking) {
            createdBookings.push(booking);
            return { eventId: 'event-test-1' };
        }
    });

    const authRoutes = requireFresh('../../routes/auth');
    const bookingRoutes = requireFresh('../../routes/booking');
    const inquiryRoutes = requireFresh('../../routes/inquiries');
    const voiceRoutes = requireFresh('../../ivr/routes');
    const whatsappRoutes = requireFresh('../../routes/whatsapp');

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        const sessionId = req.get('x-test-session');
        const existingSession = sessionId && sessions.get(sessionId);

        req.session = existingSession || {
            save(callback) {
                const id = `session-${nextSessionId++}`;
                sessions.set(id, this);
                res.set('x-test-session', id);
                callback();
            },
            destroy(callback) {
                if (sessionId) {
                    sessions.delete(sessionId);
                }
                callback();
            }
        };

        next();
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/booking', bookingRoutes);
    app.use('/api/booking', bookingRoutes.adminRouter);
    app.use('/api/inquiries', inquiryRoutes);
    app.use('/api/voice', voiceRoutes);
    app.use('/api/ivr', voiceRoutes.adminRouter);
    app.use('/api/whatsapp', whatsappRoutes);
    app.use((error, req, res, next) => {
        res.status(error.status || 500).json({ error: error.message });
    });

    appServer = await new Promise(resolve => {
        const server = app.listen(0, '127.0.0.1', () => resolve(server));
    });
    const address = appServer.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
    createdInquiries.length = 0;
    createdBookings.length = 0;
    sessions.clear();
    nextSessionId = 1;
});

after(async () => {
    if (appServer) {
        await new Promise(resolve => appServer.close(resolve));
    }
    restorers.reverse().forEach(restore => restore());
});

test('public lead capture requires contact details and consent evidence', async () => {
    const missingContact = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ name: 'No contact provided' })
    });

    assert.equal(missingContact.response.status, 400);
    assert.equal(missingContact.body.error, 'Phone or email is required');
    assert.equal(createdInquiries.length, 0);

    const missingPrivacyConsent = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ phone: '0501234567' })
    });

    assert.equal(missingPrivacyConsent.response.status, 400);
    assert.equal(missingPrivacyConsent.body.error, 'Privacy consent is required');
    assert.equal(createdInquiries.length, 0);

    const missingSensitiveDataConsent = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
            phone: '0501234567',
            week: 12,
            privacyConsent: true
        })
    });

    assert.equal(missingSensitiveDataConsent.response.status, 400);
    assert.equal(
        missingSensitiveDataConsent.body.error,
        'Sensitive data consent is required when pregnancy week is provided'
    );
    assert.equal(createdInquiries.length, 0);

    const invalidPregnancyWeek = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
            phone: '0501234567',
            week: '43',
            privacyConsent: true,
            sensitiveDataConsent: true
        })
    });

    assert.equal(invalidPregnancyWeek.response.status, 400);
    assert.equal(
        invalidPregnancyWeek.body.error,
        'Pregnancy week must be a whole number between 1 and 42'
    );
    assert.equal(createdInquiries.length, 0);

    const oversizedMessage = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
            phone: '0501234567',
            message: 'x'.repeat(1001),
            privacyConsent: true
        })
    });

    assert.equal(oversizedMessage.response.status, 400);
    assert.equal(oversizedMessage.body.error, 'message exceeds the 1000 character limit');
    assert.equal(createdInquiries.length, 0);

    const accepted = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
            name: ' Patient ',
            phone: ' 0501234567 ',
            service: 'Consultation',
            week: '12',
            message: 'Please call',
            privacyConsent: true,
            sensitiveDataConsent: true
        })
    });

    assert.equal(accepted.response.status, 201);
    assert.deepEqual(accepted.body, { success: true, inquiryId: 'INQ-TEST-1' });
    assert.equal(createdInquiries.length, 1);
    assert.equal(createdInquiries[0].source, 'website');
    assert.equal(createdInquiries[0].name, 'Patient');
    assert.equal(createdInquiries[0].phone, '0501234567');
    assert.equal(createdInquiries[0].week, '12');
    assert.equal(createdInquiries[0].privacyConsent, true);
    assert.equal(createdInquiries[0].sensitiveDataConsent, true);
    assert.equal(createdInquiries[0].consentPolicyVersion, '2026-02');
    assert.equal(createdInquiries[0].consentRecordedAt instanceof Date, true);

    const acceptedWithoutPregnancyWeek = await request('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
            email: 'patient@example.test',
            privacyConsent: true
        })
    });

    assert.equal(acceptedWithoutPregnancyWeek.response.status, 201);
    assert.equal(createdInquiries[1].sensitiveDataConsent, false);
});

test('admin inquiry listing is blocked without login and available after login', async () => {
    const unauthenticated = await request('/api/inquiries');
    assert.equal(unauthenticated.response.status, 401);
    assert.equal(unauthenticated.body.code, 'LOGIN_REQUIRED');

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: 'admin@example.test',
            password: 'correct-password'
        })
    });
    assert.equal(login.response.status, 200);
    assert.equal(login.body.user.displayName, 'Clinic Admin');

    const sessionId = login.response.headers.get('x-test-session');
    const authenticated = await request('/api/inquiries', {
        headers: { 'x-test-session': sessionId }
    });

    assert.equal(authenticated.response.status, 200);
    assert.equal(authenticated.body.total, 1);
    assert.equal(authenticated.body.items[0].inquiryId, 'INQ-TEST-1');
});

test('booking reservation creates an event only for an available time slot', async () => {
    const confirmed = await request('/api/booking/reserve', {
        method: 'POST',
        body: JSON.stringify({
            name: 'Patient',
            email: 'patient@example.test',
            phone: '0501234567',
            meetingTypeId: 'consultation',
            date: '2026-06-15',
            time: '09:00'
        })
    });

    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.booking.eventId, 'event-test-1');
    assert.equal(createdBookings.length, 1);

    const unavailable = await request('/api/booking/reserve', {
        method: 'POST',
        body: JSON.stringify({
            name: 'Patient',
            email: 'patient@example.test',
            meetingTypeId: 'consultation',
            date: '2026-06-16',
            time: '09:00'
        })
    });

    assert.equal(unavailable.response.status, 409);
    assert.equal(unavailable.body.error, 'This time slot is no longer available');
    assert.equal(createdBookings.length, 1);
});

test('booking settings cache refresh requires login', async () => {
    const unauthenticated = await request('/api/booking/refresh-settings', {
        method: 'POST'
    });
    assert.equal(unauthenticated.response.status, 401);

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: 'admin@example.test',
            password: 'correct-password'
        })
    });
    const sessionId = login.response.headers.get('x-test-session');
    const authenticated = await request('/api/booking/refresh-settings', {
        method: 'POST',
        headers: { 'x-test-session': sessionId }
    });

    assert.equal(authenticated.response.status, 200);
    assert.equal(authenticated.body.success, true);
});

test('pending voice callbacks and WhatsApp entry points remain disabled during migration', async () => {
    const voice = await request('/api/voice/status', {
        method: 'POST',
        body: JSON.stringify({ from: '+972501234567' })
    });
    assert.equal(voice.response.status, 501);
    assert.equal(voice.body.phase, 'texml-migration');

    const whatsapp = await request('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ to: '+972501234567', message: 'hello' })
    });
    assert.equal(whatsapp.response.status, 501);
    assert.equal(whatsapp.body.phase, 'deferred');
});

test('IVR administration requires login and settings omit live queue details', async () => {
    const unauthenticated = await request('/api/ivr/settings', {
        method: 'POST',
        body: JSON.stringify({
            whatsappFallback: true
        })
    });

    assert.equal(unauthenticated.response.status, 401);

    const unauthenticatedQueue = await request('/api/ivr/queue');
    assert.equal(unauthenticatedQueue.response.status, 401);

    const publicVoiceAlias = await fetch(`${baseUrl}/api/voice/settings`);
    assert.equal(publicVoiceAlias.status, 404);

    const publicVoiceQueueAlias = await fetch(`${baseUrl}/api/voice/queue`);
    assert.equal(publicVoiceQueueAlias.status, 404);

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: 'admin@example.test',
            password: 'correct-password'
        })
    });
    const sessionId = login.response.headers.get('x-test-session');
    const update = await request('/api/ivr/settings', {
        method: 'POST',
        headers: { 'x-test-session': sessionId },
        body: JSON.stringify({
            whatsappFallback: true
        })
    });

    assert.equal(update.response.status, 200);
    assert.equal(Object.hasOwn(update.body.settings, 'whatsappFallback'), false);
    assert.equal(Object.hasOwn(update.body.settings, 'currentQueue'), false);
});
