# Architecture

## 構成概要
- ルートの `dashboard.html` から各学習アプリへ遷移するポータル構成。
- 歴史アプリは以下の2系統を並行運用。
  - 基礎版: `trial-history.html`（外部 GitHub Pages へリダイレクト）
  - v2 開発版: `apps/history-quiz-app-v2/index.html`（本リポジトリ内静的配信）

## v2 アプリ配置方針
- `apps/history-quiz-app-v2/` 配下に HTML/CSS/JS/データを同居。
- 参照パスはすべて相対パスで解決し、GitHub Pages でも動作するようにする。

## 会員認証
- ブラウザ側の認証連携境界を `scripts/auth-client.js` に集約する。
- 認証基盤の公開URLは各入口HTMLの `uptra-auth-base-url` メタタグから読み取る。リポジトリには本番URL、トークン、秘密鍵を保存しない。
- `dashboard.html` は認証基盤の `GET /api/auth/session` が `{"authenticated":true}` を返すまで本文を隠し、失敗時はログインへ戻す。
- ログイン・会員登録は認証基盤の `/login`・`/signup` へ `return_to` を付けて遷移し、ログアウトは資格情報付きで `POST /api/auth/logout` を呼ぶ。
- 認証基盤はHTTPSを必須とする（ローカル開発の `localhost` のみHTTPを許可）。
