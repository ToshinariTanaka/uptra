# uptra
アップ塾トレーニングサイト

## 追加アプリ
- `apps/history-quiz-app-v2/`: 中学歴史一問一答 v2（開発版）

## 導線
- ログイン後の `dashboard.html` から v2 に遷移可能。
- 既存の基礎版（`trial-history.html`）はそのまま利用可能。
- 英語学習アプリ導線は `https://english-words-game-1ph3.onrender.com/study-app/`、英単語RPG導線は `https://english-words-game-1ph3.onrender.com/` を使用。誤ったRender URLは使用しない。

## 会員認証基盤
- `login.html`、`signup.html`、`dashboard.html` の `uptra-auth-base-url` メタタグに、会員認証基盤の公開URLをデプロイ設定で指定する（秘密鍵やトークンは設定しない）。
- 認証基盤は `GET /api/auth/session`（成功時は `{"authenticated":true}`）、`POST /api/auth/logout`、`/login`、`/signup` を提供し、アプトレのオリジンから資格情報付きリクエストを許可する必要がある。
- 公開URLが未設定、セッションが無効、または認証確認に失敗した場合、学習メニューは表示されない（fail closed）。
- ローカルの固定パスワードおよび `sessionStorage` を認証根拠として使用しない。

## 自動テスト
```sh
npm test
```
