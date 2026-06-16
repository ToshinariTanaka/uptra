## 今回やったこと
- UpTra本体の `dashboard.html` にある「Render URL未設定」だった英語学習アプリ／英単語RPG導線を、確認済みのRender Web Service URLへ差し替えました。
- 英語学習アプリのリンク先を `https://english-words-game-1ph3.onrender.com/study-app/` に設定しました。
- 英単語RPGのリンク先を `https://english-words-game-1ph3.onrender.com/` に設定しました。
- 以前の誤URL（サービス名に `-1ph3` が付かないURL）を使用していないことを確認しました。
- 今日のおすすめ文言から「正しいRender URLが確認でき次第有効化します」という未設定向け説明を削除しました。

## 変更ファイル
- `dashboard.html`
- `README.md`
- `docs/project_status.md`
- `docs/next_tasks.md`
- `docs/codex_report.md`

## テスト結果
- `python - <<'PY' ... PY` を実行し、`dashboard.html` の英語学習アプリリンクが `https://english-words-game-1ph3.onrender.com/study-app/`、英単語RPGリンクが `https://english-words-game-1ph3.onrender.com/` であることを確認しました。
- `! rg "english-words-game\.onrender\.com|Render URL未設定" dashboard.html README.md docs/project_status.md docs/next_tasks.md` を実行し、誤URLと未設定表示が対象ファイルに残っていないことを確認しました。
- `git diff --check` を実行し、空白エラーがないことを確認しました。
- `python -m http.server 4176 >/tmp/uptra-http.log 2>&1 & ...` を実行し、ローカル配信した `dashboard.html` から指定URLを含むHTMLが取得できることを確認しました。

## 注意点
- 実際のRenderアプリ画面表示やログイン後の外部遷移は、この環境ではブラウザ操作を行っていないため未確認です。
- UI変更は、無効表示だった2つの導線を通常のリンクボタンへ戻す内容です。スクリーンショットは未取得です。
- 既存の「中学英単語RPGを開く」GitHub Pages導線は、今回の指定対象外のため維持しています。

## 次にやるべきこと
- デプロイ後、UpTraにログインして「英語学習アプリ」をクリックし、遷移先URLが `https://english-words-game-1ph3.onrender.com/study-app/` になることを実機ブラウザで確認してください。
- デプロイ後、「英単語RPG」をクリックし、遷移先URLが `https://english-words-game-1ph3.onrender.com/` になることを実機ブラウザで確認してください。
- Render版で英単語・チャンク・英文和訳の3モード、CSV/Excelアップロード、PC/iPhone間の同一URL共有を確認してください。

## チャッピーに相談すべき点
- 既存の「中学英単語RPGを開く」GitHub Pages導線もRender版へ統一するかどうか確認してください。
