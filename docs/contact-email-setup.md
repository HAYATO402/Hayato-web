# お問い合わせ送信の本番設定

静的HTMLは維持し、`api/contact.js` のVercel Node.js FunctionからResendへ送信します。
宛先は `hayato@genes0302.co.jp` 固定です。API受付と受信箱への配達は別です。
未設定のままmainへマージしないでください。秘密鍵をチャット、HTML、Gitに貼らないでください。

## 1. Resend

1. https://resend.com/signup でアカウントを作成します。
2. Domainsに送信専用サブドメイン `mail.genes0302.co.jp` を追加します。
3. お名前.comのDNSにResendが指定した送信用レコードを追加します。値は管理画面のものを使用します。
4. Google Workspace用の既存MX・TXTを削除・上書きしないでください。Resendの受信機能は不要です。
5. Verifiedになったら、送信専用権限・対象ドメイン限定のAPIキーを作成します。

## 2. 迷惑送信防止

CloudflareのTurnstileでManagedウィジェットを作成します。
許可ホスト名に `hayato-web-rho.vercel.app` を指定します。
Previewでもテストする場合は、実際のPreviewホスト名を追加します。
ドメインやネームサーバーをCloudflareに移管する必要はありません。

## 3. Vercelの環境変数

Project > Settings > Environment Variablesに次を設定します。

| 変数 | 値 |
| --- | --- |
| RESEND_API_KEY | Resendの送信専用APIキー（秘密） |
| CONTACT_FROM_EMAIL | Genes Website <contact@mail.genes0302.co.jp> |
| TURNSTILE_SITE_KEY | Turnstileのサイトキー（公開可能） |
| TURNSTILE_SECRET_KEY | Turnstileの秘密キー |
| CONTACT_SITE_ORIGIN | https://hayato-web-rho.vercel.app |

Productionとテスト対象のPreviewに設定します。PreviewのCONTACT_SITE_ORIGINはそのPreviewの正確なoriginに上書きします（末尾スラッシュなし）。
Framework PresetはOtherを維持し、ルートのapiディレクトリがVercel Functionsとして検出されることを確認します。Node.jsは22以上を使用します。
Vercel Firewallで `/api/contact` のPOSTにレート制限を設定することも推奨します。Turnstileはサーバーで毎回検証し、未設定なら送信を拒否します。

## 4. 検証と公開

1. `node --test tests/contact.test.cjs` でモックテストを実行します（実メールは送信しません）。
2. 設定済みPreviewでPC/スマートフォンのフォーム表示とTurnstile動作を確認します。
3. テストと明記した問い合わせを1件送信します。
4. ResendのEmails画面で受付IDと配信イベント（Delivered / Bounced等）を確認します。
5. 実際の受信箱に届くこと、返信先がお客様の入力アドレスであることを確認します。
6. PRの差分を確認し、mainへマージしてVercel本番を検証します。環境変数変更後は再デプロイが必要です。

エラー時は完了画面に移動せず入力を保持します。タイムアウト時は配送結果が不明なので自動再送しません。同一内容の再送は同じ1時間枠内でResendの冪等キーにより重複を抑えます。
ログには本文・メールアドレス・秘密鍵を出さず、受付IDまたはHTTPステータスだけを記録します。
未着時は再送を繰り返さず、Resendの配信イベントとGoogle Workspaceのメールログを照合します。

## 公式資料

- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/dashboard/domains/introduction
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://vercel.com/docs/functions/runtimes/node-js
