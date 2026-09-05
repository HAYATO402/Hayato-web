const { createHash } = require('node:crypto');

const recipient = 'hayato@genes0302.co.jp';
const fallback = '送信を完了できませんでした。時間をおいて再度お試しいただくか、hayato@genes0302.co.jp へ直接ご連絡ください。';

function createHandler(env = process.env, request = fetch, log = console.info) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const respond = (status, data) => res.status(status).json(data);
    const fail = (status, error = fallback) => respond(status, { error });
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return fail(405);
    }
    const origin = env.CONTACT_SITE_ORIGIN || 'https://hayato-web-rho.vercel.app';
    let hostname;
    try { hostname = new URL(origin).hostname; } catch { return fail(503); }
    if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL ||
        !env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY) return fail(503);
    if (req.method === 'GET') return respond(200, { siteKey: env.TURNSTILE_SITE_KEY });
    if (req.headers.origin !== origin) return fail(403);
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return fail(415);
    let body;
    try {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!raw || Buffer.byteLength(raw) > 24000) return fail(413);
      body = JSON.parse(raw);
      if (!body || Array.isArray(body) || typeof body !== 'object') return fail(400);
    } catch { return fail(400); }
    const field = (key, max) => typeof body[key] === 'string' && body[key].trim().length <= max
      ? body[key].trim() : '';
    const name = field('name', 100);
    const email = field('email', 254);
    const prefecture = field('prefecture', 10);
    const category = field('category', 30);
    const message = field('message', 5000);
    const token = field('token', 2048);
    if (body.website) return fail(400);
    if (!name || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
        !prefecture || !['AI改善診断', 'AI導入支援', '相談のみ'].includes(category) ||
        !message || !token || /[\r\n]/.test(name + prefecture)) {
      return fail(400, '入力内容と迷惑送信防止の確認を見直してください。');
    }
    try {
      const verification = await request('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
        signal: AbortSignal.timeout(8000)
      });
      if (!verification.ok) return fail(503);
      const checked = await verification.json();
      if (!checked.success || checked.hostname !== hostname || checked.action !== 'contact') {
        return fail(400, '迷惑送信防止の確認が切れました。もう一度確認して送信してください。');
      }
      const payload = {
        from: env.CONTACT_FROM_EMAIL,
        to: [recipient],
        reply_to: email,
        subject: '株式会社genes お問い合わせ',
        text: `お名前: ${name}\nメールアドレス: ${email}\n都道府県: ${prefecture}\nお問い合わせ種別: ${category}\n\nお問い合わせ内容:\n${message}`
      };
      // Deduplicate identical retries for one hour without storing personal data.
      const key = createHash('sha256').update(JSON.stringify(payload) + Math.floor(Date.now() / 3600000)).digest('hex');
      const delivery = await request('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact-${key}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      if (!delivery.ok) {
        log('contact_delivery_failed', { status: delivery.status });
        return fail(502);
      }
      const data = await delivery.json();
      if (typeof data.id !== 'string' || !data.id) return fail(502);
      // An API receipt is not proof of inbox delivery. Inspect Resend events.
      log('contact_accepted', { id: data.id });
      return respond(200, { accepted: true });
    } catch {
      log('contact_service_unavailable');
      return fail(503);
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
