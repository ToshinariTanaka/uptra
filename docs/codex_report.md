## 今回やったこと
- `apps/history-quiz-app-v2/` を新規作成し、既存の歴史アプリ（history-basic）をベースにした v2 静的ファイル群を追加しました。
- `dashboard.html` にのみ「中学歴史一問一答 v2（開発版）」導線を追加し、トップページ `index.html` は変更していません。
- 既存の「英文読解トレーニング」「中学歴史一問一答基礎」等の既存導線はそのまま維持しました。

## 変更ファイル
- dashboard.html
- apps/history-quiz-app-v2/index.html
- apps/history-quiz-app-v2/style.css
- apps/history-quiz-app-v2/script.js
- apps/history-quiz-app-v2/sound-settings.js
- apps/history-quiz-app-v2/start-era-fix.js
- apps/history-quiz-app-v2/quiz-data_rekishi3.json
- docs/codex_report.md
- docs/architecture.md
- docs/next_tasks.md
- docs/project_status.md
- README.md

## テスト結果
- `git diff --check` を実行し、問題なし。
- `python -m http.server 8000` でローカル起動し、`dashboard.html` から v2 リンクが `apps/history-quiz-app-v2/index.html` に遷移することを確認。

## 注意点
- 今回の v2 は既存 `history-basic` を複製した初期並行公開版です。機能差分（問題追加、UI刷新など）は未着手です。
- GitHub Pages 配備時は、相対パス前提のため `apps/history-quiz-app-v2/` 配下で完結する構成を維持してください。

## 次にやるべきこと
- v2 専用の問題セット拡張と、基礎版との差分要件を定義する。
- v2 の識別性向上（タイトル文言、バージョン表記、更新履歴）を追加する。

## チャッピーに相談すべき点
- v2 を「開発版」表示のまま運用する期間と、正式版切り替え条件。
- v2 の問題データ方針（既存データ流用 or 新データ構築）。
