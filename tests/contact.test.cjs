const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/contact.js');

const env = {
  RESEND_API_KEY: 'test-only', CONTACT_FROM_EMAIL: 'Genes <contact@mail.example.com>',
  TURNSTILE_SITE_KEY: 'public-test', TURNSTILE_SECRET_KEY: 'secret-test',
  CONTACT_SITE_ORIGIN: 'https://example.com'
};
const valid = {
  name: 'Test', email: 'visitor@example.net', prefecture: '東京都',
  category: '相談のみ', message: 'Synthetic test only', token: 'test-token', website: ''
};
async function run(options = {}) {
  const calls = [];
  const logs = [];
  const request = async (url, init) => {
    calls.push({ url, ...init });
    if (options.throw) throw new Error('network');
    const verification = url.includes('siteverify');
    return {
      ok: verification ? true : !options.resendError,
      status: options.resendError || 200,
      json: async () => verification
        ? { success: true, hostname: 'example.com', action: 'contact', ...options.verification }
        : (options.receipt || { id: 'email-test-id' })
    };
  };
  const res = {
    headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; }
  };
  await createHandler({ ...env, ...options.env }, request, (...args) => logs.push(args))({
    method: options.method || 'POST',
    headers: { origin: 'https://example.com', 'content-type': 'application/json', ...options.headers },
    body: options.body === undefined ? valid : options.body
  }, res);
  return { res, calls, logs };
}

test('accepts only a verified request and fixes recipient/reply-to', async () => {
  const { res, calls, logs } = await run({ body: { ...valid, to: 'attacker@example.net' } });
  assert.equal(res.code, 200);
  assert.equal(res.data.accepted, true);
  assert.equal(calls.length, 2);
  const payload = JSON.parse(calls[1].body);
  assert.deepEqual(payload.to, ['hayato@genes0302.co.jp']);
  assert.equal(payload.reply_to, valid.email);
  assert.equal(payload.from, env.CONTACT_FROM_EMAIL);
  assert.ok(calls[1].headers['Idempotency-Key']);
  assert.equal(JSON.stringify(logs).includes(valid.email), false);
  assert.equal(JSON.stringify(logs).includes(valid.message), false);
});
test('configuration exposes only public site key', async () => {
  const { res, calls } = await run({ method: 'GET' });
  assert.deepEqual(res.data, { siteKey: env.TURNSTILE_SITE_KEY });
  assert.equal(calls.length, 0);
});
test('missing secrets fails closed', async () => {
  const { res, calls } = await run({ env: { RESEND_API_KEY: '' } });
  assert.equal(res.code, 503); assert.equal(calls.length, 0);
});
test('foreign origin is rejected', async () => {
  const { res, calls } = await run({ headers: { origin: 'https://attacker.example' } });
  assert.equal(res.code, 403); assert.equal(calls.length, 0);
});
test('unsupported method and content type rejected', async () => {
  assert.equal((await run({ method: 'PUT' })).res.code, 405);
  assert.equal((await run({ headers: { 'content-type': 'text/plain' } })).res.code, 415);
});
test('malformed and oversized bodies rejected', async () => {
  assert.equal((await run({ body: '{' })).res.code, 400);
  assert.equal((await run({ body: null })).res.code, 400);
  assert.equal((await run({ body: 'x'.repeat(24001) })).res.code, 413);
});
test('invalid, missing and overlong fields never send mail', async () => {
  for (const change of [{ email: 'bad\n@example.com' }, { name: '' },
    { category: 'invalid' }, { message: 'x'.repeat(5001) }, { token: '' }, { website: 'spam' }]) {
    const { res, calls } = await run({ body: { ...valid, ...change } });
    assert.equal(res.code, 400); assert.equal(calls.length, 0);
  }
});
test('failed CAPTCHA, hostname and action cannot send mail', async () => {
  for (const verification of [{ success: false }, { hostname: 'evil.example' }, { action: 'other' }]) {
    const { res, calls } = await run({ verification });
    assert.equal(res.code, 400); assert.equal(calls.length, 1);
  }
});
test('provider rejection never reports success', async () => {
  const { res } = await run({ resendError: 429 });
  assert.equal(res.code, 502); assert.equal(res.data.accepted, undefined);
});
test('missing receipt never reports success', async () => {
  assert.equal((await run({ receipt: {} })).res.code, 502);
});
test('network failure never reports success or exposes secrets', async () => {
  const { res } = await run({ throw: true });
  assert.equal(res.code, 503);
  assert.equal(JSON.stringify(res.data).includes('secret-test'), false);
});
test('identical submissions reuse provider deduplication key', async () => {
  const a = await run();
  const b = await run();
  assert.equal(a.calls[1].headers['Idempotency-Key'], b.calls[1].headers['Idempotency-Key']);
});
