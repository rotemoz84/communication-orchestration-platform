const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const index = readFileSync(path.join(__dirname, '../../index.js'), 'utf8');
const bookingRoutes = readFileSync(path.join(__dirname, '../../routes/booking.js'), 'utf8');

test('manual calendar sync is mounted after session initialization with authentication', () => {
    const sessionMount = index.indexOf('app.use(session({');
    const syncMount = index.indexOf("app.post(BASE_PATH + '/api/sync/calendar', requireAuth, syncCalendar);");

    assert.notEqual(sessionMount, -1);
    assert.notEqual(syncMount, -1);
    assert.ok(sessionMount < syncMount, 'calendar sync must be mounted after session initialization');
    assert.doesNotMatch(index, /res\.status\(500\)\.json\(\{ error: error\.message \}\);/);
});

test('booking settings refresh is exported as an authenticated administration route', () => {
    assert.match(bookingRoutes, /adminRouter\.use\(requireAuth\);/);
    assert.match(bookingRoutes, /adminRouter\.post\('\/refresh-settings'/);
    assert.doesNotMatch(bookingRoutes, /router\.post\('\/refresh-settings'/);
    assert.match(index, /app\.use\(BASE_PATH \+ '\/api\/booking', bookingAdminRoutes\);/);
});
