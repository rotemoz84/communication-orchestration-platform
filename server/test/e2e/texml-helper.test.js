const assert = require('node:assert/strict');
const test = require('node:test');
const {
    HEBREW_SAY_DEFAULTS,
    texmlDial,
    texmlGather,
    texmlHangup,
    texmlResponse,
    texmlSay
} = require('../../integrations/telnyx/voice');

test('generates an open-hours dial TeXML response and escapes dynamic values', () => {
    const xml = texmlResponse(texmlDial(
        '+972501234567',
        {
            action: '/api/voice/dial-callback?reason="open"&attempt=<1>',
            method: 'POST',
            timeout: 20,
            callerId: '+972509876543'
        },
        {
            statusCallback: '/api/voice/status?leg=rep&event=completed'
        }
    ));

    assert.equal(
        xml,
        '<?xml version="1.0" encoding="UTF-8"?>'
        + '<Response>'
        + '<Dial action="/api/voice/dial-callback?reason=&quot;open&quot;&amp;attempt=&lt;1&gt;" method="POST" timeout="20" callerId="+972509876543">'
        + '<Number statusCallback="/api/voice/status?leg=rep&amp;event=completed">+972501234567</Number>'
        + '</Dial>'
        + '</Response>'
    );
});

test('generates a Hebrew DTMF menu using centralized Say defaults', () => {
    const xml = texmlResponse(texmlGather(
        'לקבלת הודעת המשך, הקישו 9 & המתינו ל<אישור>.',
        {
            action: '/api/voice/closed-menu?source=closed&choice=9',
            timeout: 15,
            numDigits: 1,
            validDigits: '9'
        }
    ));

    assert.deepEqual(HEBREW_SAY_DEFAULTS, {
        voice: 'alice',
        language: 'he-IL'
    });
    assert.equal(
        xml,
        '<?xml version="1.0" encoding="UTF-8"?>'
        + '<Response>'
        + '<Gather action="/api/voice/closed-menu?source=closed&amp;choice=9" timeout="15" numDigits="1" validDigits="9">'
        + '<Say voice="alice" language="he-IL">לקבלת הודעת המשך, הקישו 9 &amp; המתינו ל&lt;אישור&gt;.</Say>'
        + '</Gather>'
        + '</Response>'
    );
});

test('generates a goodbye TeXML response with a hangup verb', () => {
    const xml = texmlResponse(
        texmlSay('תודה ולהתראות.'),
        texmlHangup()
    );

    assert.equal(
        xml,
        '<?xml version="1.0" encoding="UTF-8"?>'
        + '<Response>'
        + '<Say voice="alice" language="he-IL">תודה ולהתראות.</Say>'
        + '<Hangup/>'
        + '</Response>'
    );
});
