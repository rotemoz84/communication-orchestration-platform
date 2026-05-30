const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const path = require('node:path');
const vm = require('node:vm');

const adminHtml = readFileSync(
    path.join(__dirname, '../../public/admin/index.html'),
    'utf8'
);

test('admin inquiry rows render untrusted fields with DOM text properties', () => {
    assert.match(adminHtml, /function appendTextCell\(rowEl, value, className\)/);
    assert.match(adminHtml, /cell\.textContent =/);
    assert.match(adminHtml, /messageCell\.title = fullMessage;/);
    assert.match(adminHtml, /editButton\.dataset\.notes = row\.notes \|\| '';/);
    assert.doesNotMatch(adminHtml, /tbody\.innerHTML = items\.map/);
});

test('admin inquiry renderer keeps submitted HTML as literal text', () => {
    class FakeElement {
        constructor(tagName) {
            this.tagName = tagName;
            this.children = [];
            this.dataset = {};
            this._textContent = '';
        }

        appendChild(child) {
            this.children.push(child);
            return child;
        }

        get textContent() {
            return this._textContent;
        }

        set textContent(value) {
            this._textContent = String(value);
            this.children = [];
        }
    }

    const rendererSource = adminHtml.match(
        /      var STATUS_LABELS =[\s\S]*?(?=\n      function loadInquiries\(\))/
    );
    assert.ok(rendererSource, 'Could not find admin inquiry renderer');

    const context = {
        document: {
            createElement(tagName) {
                return new FakeElement(tagName);
            }
        }
    };
    vm.runInNewContext(`${rendererSource[0]}\nthis.renderInquiryRows = renderInquiryRows;`, context);

    const payload = '<img src=x onerror="globalThis.compromised=true">';
    const tbody = new FakeElement('tbody');
    context.renderInquiryRows(tbody, [{
        name: payload,
        phone: payload,
        email: payload,
        service: payload,
        message: payload,
        status: payload,
        inquiryId: payload,
        notes: payload
    }], {});

    const row = tbody.children[0];
    assert.equal(row.children[1].textContent, payload);
    assert.equal(row.children[5].textContent, payload);
    assert.equal(row.children[5].title, payload);
    assert.equal(row.children[7].children[0].dataset.notes, payload);
    assert.equal(row.children.some(cell => cell.tagName === 'img'), false);
});
