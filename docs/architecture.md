# Architecture

## 構成概要
- ルートの `dashboard.html` から各学習アプリへ遷移するポータル構成。
- 歴史アプリは以下の2系統を並行運用。
  - 基礎版: `trial-history.html`（外部 GitHub Pages へリダイレクト）
  - v2 開発版: `apps/history-quiz-app-v2/index.html`（本リポジトリ内静的配信）

## 会員認証
- ブラウザは同一オリジンの認証プロキシだけを利用し、Cookieを含めて通信する。
- `functions/_middleware.js` は `dashboard.html` の配信前にmemberセッションを上流で確認し、未認証・期限切れ・上流障害時は内容を配信せずログイン画面へ戻す。
- Cloudflare Pages Functions の `functions/api/[[path]].js` は、会員ログイン（POST）、会員セッション確認（GET）、ログアウト（POST）の3経路だけを許可する。その他のパスとメソッドは拒否する。
- 上流認証APIは環境変数 `AUTH_API_ORIGIN` で指定し、資格情報・パス・query・fragmentを含まないHTTPSオリジンだけを許可する。
- プロキシは受信URLから生成した `X-Forwarded-Host` / `X-Forwarded-Proto`、Cloudflareの `CF-Connecting-IP` から生成した `X-Forwarded-For`、および `Origin` / `Sec-Fetch-Site` / `User-Agent` を上流へ渡す。利用者が送信した `X-Forwarded-For` は転送しない。
- POSTはJSON、入力形式、4096バイトの本文上限を検証する。ログアウト本文はmember専用の `{ "accountType": "member" }` に固定する。
- 上流の `Set-Cookie` は `Domain` 属性だけを除去してhost-only Cookieとし、`Secure`、`HttpOnly`、`SameSite`を含むその他の属性を維持する。
- 複数の `Set-Cookie` はCloudflare Workersの個別Cookie APIで取得し、結合せず別々のレスポンスヘッダーとして返す。
- 上流通信失敗や不正なCookie応答は、内部情報を含まない502 JSONとして処理する。
- ログアウトはセッション確認レスポンスのCSRFトークンを `X-CSRF-Token` に設定する。クライアント保存の疑似ログイン状態は使用しない。
- 公開signupは提供しない。

## v2 アプリ配置方針
- `apps/history-quiz-app-v2/` 配下に HTML/CSS/JS/データを同居。
- 参照パスはすべて相対パスで解決し、GitHub Pages でも動作するようにする。
