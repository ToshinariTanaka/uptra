# uptra
アップ塾トレーニングサイト

## 追加アプリ
- `apps/history-quiz-app-v2/`: 中学歴史一問一答 v2（開発版）

## 導線
- 会員は会員ID・パスワードでログインし、サーバーセッション確認後に `dashboard.html` を利用可能。
- 公開会員登録ページは提供しない。
- 認証プロキシの実行環境には `AUTH_API_ORIGIN`（認証APIのオリジン）を設定する。本番値をリポジトリへ記録しない。
- ログイン後の `dashboard.html` から v2 に遷移可能。
- 既存の基礎版（`trial-history.html`）はそのまま利用可能。
- 英語学習アプリ導線は `https://english-words-game-1ph3.onrender.com/study-app/`、英単語RPG導線は `https://english-words-game-1ph3.onrender.com/` を使用。誤ったRender URLは使用しない。

## ローカル確認
```sh
npm test
```
