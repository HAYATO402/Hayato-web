# Webサイト構成

## 1. 全体構成

このWebサイトは、HTMLとCSSを中心とした静的Webサイトです。

画面は引き続き静的HTML/CSSです。お問い合わせのみ、contact.jsから
Vercelのapi/contact.js（Node.js Function）を呼び、Turnstileで検証してResendへ送信します。
Next.js、React、データベースは使用しません。設定手順はcontact-email-setup.mdを参照してください。

## 2. ファイル構成

```text
company-website/
├── index.html
├── styles.css
├── thanks.html
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── .gitignore
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── docs/
│   ├── requirements.md
│   └── architecture.md
└── tasks/
    └── current-task.md
