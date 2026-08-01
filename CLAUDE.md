# Claude Code Project Instructions

## プロジェクト概要

このプロジェクトは、Genesの会社・サービス紹介Webサイトです。

主な目的は、AI導入支援や業務効率化などのサービス内容を伝え、
企業や事業者からの問い合わせにつなげることです。

## 技術構成

- HTML
- CSS
- SVG
- GitHub
- Vercel

現在は静的Webサイトです。
明示的な指示がない限り、フレームワークへの移行は行わないでください。

## 必ず読むファイル

作業前に以下を確認してください。

- `README.md`
- `docs/requirements.md`
- `docs/architecture.md`
- `tasks/current-task.md`

## 開発ルール

- mainブランチを直接変更しない
- 現在のブランチを確認してから作業する
- 指示された範囲だけを変更する
- 大規模なデザイン変更は事前に計画を提示する
- 既存ファイルを削除する前に確認する
- 勝手にGitHubへpushしない
- 勝手にmainへマージしない
- 勝手に本番公開しない

## セキュリティ

- APIキーやパスワードをコードへ書かない
- `.env`系ファイルをGitへ追加しない
- 個人情報や顧客情報を保存しない

## iCloudバックアップルール

ファイルを変更する前に、以下のコマンドを実行する。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\backup-to-icloud.ps1" -Stage before

## 完了時の報告

作業完了後は、以下を日本語で報告してください。

- 変更したファイル
- 変更内容
- 確認した内容
- 未解決の問題
- 人間による確認が必要な箇所