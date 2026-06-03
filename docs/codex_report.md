## 今回やったこと
- 既存の `dashboard.html` を確認し、学習メニューが静的HTMLのリンク一覧で構成されていることを確認しました。
- 学習メニューの先頭に「中学英単語RPGを開く」ボタンを追加し、リンク先を `https://toshinaritanaka.github.io/junior-english-words-game/` に設定しました。
- 指定された表示順に合わせて、既存ボタンの並び順を調整しました。
- 既存の「英単語RPGを開く」ボタン、ログイン判定、ログアウト処理、既存アプリへのリンクは維持しました。
- 既存ボタンと同じ `btn btn-primary` クラスを使用し、追加CSSやスマホ表示向けスタイル変更は行っていません。

## 変更ファイル
- `dashboard.html`
- `docs/codex_report.md`
- `docs/project_status.md`
- `README.md`

## テスト結果
- `rg "junior-english-words-game|中学英単語RPGを開く|英単語RPGを開く" dashboard.html` を実行し、新規リンクと既存リンクが両方存在することを確認しました。
- `python - <<'PY' ... PY` を実行し、`dashboard.html` 内のボタン表示順が指定順と一致することを確認しました（リンク/ボタン要素のテキストを抽出して検証）。
- `git diff -- dashboard.html docs/codex_report.md docs/project_status.md README.md` を実行し、差分が今回の導線追加とドキュメント更新に限定されていることを確認しました。
- `which chromium || which chromium-browser || which google-chrome || which google-chrome-stable || which wkhtmltoimage || which cutycapt || which firefox || true` を実行し、スクリーンショット取得に使えるブラウザ/ツールがないことを確認しました。

## 注意点
- 今回の作業対象は UpTra 本体の `dashboard.html` のみで、`junior-english-words-game` 側のアプリ本体には変更を加えていません。
- UI変更は既存クラスを使ったリンク追加のみのため、追加のCSS変更はありません。
- スクリーンショット取得を試みましたが、環境内に Chromium / Google Chrome / Firefox / wkhtmltoimage が見つからなかったため取得できませんでした。

## 次にやるべきこと
- 本番公開後、ログイン後の会員ページで「中学英単語RPGを開く」ボタンが先頭に表示され、リンク先へ遷移できることをブラウザで確認してください。
- 必要であれば、「今日のおすすめ」の説明文に中学英単語RPGを含めるか検討してください。

## チャッピーに相談すべき点
- 「中学英単語RPG」と既存の「英単語RPG」の違いをユーザーに分かりやすくする説明文を追加するかどうか。
