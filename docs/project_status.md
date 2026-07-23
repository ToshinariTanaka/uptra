# Project Status

## 2026-07-23
- 会員認証を正式API契約（会員IDログイン、memberセッション、CSRF付きログアウト）へ移行。
- 認証プロキシを3経路・必要メソッドだけのallowlist方式で追加。
- 公開signup導線とページ、固定パスワードによる疑似認証を廃止。
- Pages Functionsのmiddlewareでダッシュボードを配信前に保護し、認証障害時もfail-closedに変更。
- Origin・監査メタデータの安全な転送、member専用本文の検証・サイズ制限、HTTPS設定検証、上流障害時の安全な502応答を追加。
- sessionとCSRFの2個のCookieを、Expiresのカンマを壊さず個別にhost-only化する処理を追加。
- API契約、CSRF、拒否制御、Cookie書き換え、セッション失効、サーバー側保護の自動テストを追加。

## 2026-06-16
- `dashboard.html` の英語学習アプリ／英単語RPG導線を確認済みRender URLに更新。
- 英語学習アプリは `https://english-words-game-1ph3.onrender.com/study-app/` に設定。
- 英単語RPGは `https://english-words-game-1ph3.onrender.com/` に設定。
- 誤ったRender URLは使用しない方針を維持。

## 2026-06-03
- `dashboard.html` の学習メニュー先頭に「中学英単語RPGを開く」を追加。
- リンク先を `https://toshinaritanaka.github.io/junior-english-words-game/` に設定。
- 既存の英単語RPG導線・歴史導線・英文読解導線・小論文導線・ログアウト処理は維持。

## 2026-05-21
- `apps/history-quiz-app-v2/index.html` を旧クイズ本体から互換用リダイレクトページへ変更。
- リダイレクト先を `https://toshinaritanaka.github.io/history-quiz-app-v2/` に統一。
- 旧本体UI要素・本体スクリプト参照を除去し、入口用途に限定。

## 2026-05-15
- history-quiz-app-v2 を `apps/history-quiz-app-v2/` に追加。
- dashboard に v2（開発版）導線を追加。
- 既存の基礎版導線・トップページ導線は維持。
