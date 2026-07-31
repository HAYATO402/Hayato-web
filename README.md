# Genes Company Website

## 概要

Genesの会社・サービス内容を紹介する公式Webサイトです。

AI導入支援、業務効率化、Webサイト制作などのサービス内容を、
企業や事業者に分かりやすく伝え、問い合わせにつなげることを目的としています。

## 公開方法

- ソースコード管理：GitHub
- ホスティング：Vercel
- 本番用ブランチ：main

mainブランチに反映された内容が、Vercelを通じて本番サイトへ公開されます。

## 使用技術

- HTML
- CSS
- SVG
- Git
- GitHub
- Vercel

現在はNode.jsやNext.jsを使用しない、静的なWebサイトです。

## 主なファイル

- `index.html`：会社Webサイトのメインページ
- `styles.css`：サイト全体のデザイン
- `thanks.html`：問い合わせ完了後のページ
- `favicon.svg`：ブラウザのタブに表示するアイコン
- `robots.txt`：検索エンジン向けの設定
- `sitemap.xml`：検索エンジン向けのページ一覧
- `.gitignore`：GitHubへ送らないファイルの設定

## 開発方針

- mainブランチを直接編集しない
- 作業ごとに作業用ブランチを作る
- 変更内容を確認してからmainへ反映する
- APIキーやパスワードをGitHubへ保存しない
- 指示がない限り、現在のHTML・CSS構成を維持する

## 作業開始時に読むファイル

1. `README.md`
2. `AGENTS.md`または`CLAUDE.md`
3. `docs/requirements.md`
4. `docs/architecture.md`
5. `tasks/current-task.md`