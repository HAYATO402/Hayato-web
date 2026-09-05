(() => {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const button = form.querySelector('[type="submit"]');
  const status = document.getElementById('contact-status');
  let token = '';
  let widget;
  let sending = false;
  const fallback = 'フォームを利用できません。下のメールリンクから直接ご連絡ください。';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (!token) {
      status.textContent = '迷惑送信防止の確認が完了するまでお待ちください。利用できない場合は下のメールリンクをご利用ください。';
      return;
    }
    sending = true;
    button.disabled = true;
    button.textContent = '送信中…';
    status.textContent = '送信しています。この画面を閉じずにお待ちください。';
    const values = new FormData(form);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.get('お名前'), email: values.get('email'),
          prefecture: values.get('都道府県'), category: values.get('お問い合わせ種別'),
          message: values.get('お問い合わせ内容'), website: values.get('_honey'), token
        }),
        signal: AbortSignal.timeout(25000)
      });
      const data = await response.json();
      if (!response.ok || data.accepted !== true) {
        status.textContent = data.error || fallback;
        return;
      }
      window.location.assign('/thanks.html');
    } catch {
      status.textContent = '送信結果を確認できませんでした。入力内容は残っています。再送すると重複する場合があります。不明な場合は下のメールリンクからご連絡ください。';
    } finally {
      sending = false;
      button.disabled = false;
      button.textContent = '送信する';
      token = '';
      if (widget !== undefined) window.turnstile.reset(widget);
    }
  });

  async function setup() {
    button.disabled = true;
    status.textContent = '送信フォームを準備しています…';
    try {
      const response = await fetch('/api/contact', { signal: AbortSignal.timeout(10000) });
      const config = await response.json();
      if (!response.ok || !config.siteKey) throw new Error('unavailable');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        const timer = setTimeout(() => reject(new Error('timeout')), 12000);
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); reject(new Error('unavailable')); };
        document.head.append(script);
      });
      widget = window.turnstile.render('#contact-verification', {
        sitekey: config.siteKey, action: 'contact', size: 'flexible',
        callback: (value) => { token = value; status.textContent = ''; },
        'expired-callback': () => { token = ''; status.textContent = '確認の有効期限が切れました。もう一度確認してください。'; },
        'error-callback': () => { token = ''; status.textContent = fallback; }
      });
      button.disabled = false;
    } catch {
      status.textContent = fallback;
    }
  }
  setup();
})();
