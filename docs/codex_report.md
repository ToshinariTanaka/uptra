## 今回やったこと
- `apps/history-quiz-app-v2/index.html` を、旧クイズ本体HTMLから**旧URL互換用の純粋なリダイレクトページ**へ置き換えました。
- 旧アプリ本体用の要素（`settings-card`、`quiz-card`）と、旧本体スクリプト参照（`script.js`、`start-era-fix.js`、`sound-settings.js`）を削除しました。
- リダイレクト実装として、`meta refresh`・案内文・手動遷移リンク・`window.location.replace` のみを残しました。

## 変更ファイル
- apps/history-quiz-app-v2/index.html
- docs/codex_report.md
- docs/project_status.md

## テスト結果
- `rg "settings-card|quiz-card|script.js|start-era-fix.js|sound-settings.js" apps/history-quiz-app-v2/index.html` を実行し、ヒット 0 件を確認。
- `rg "meta http-equiv=\"refresh\"|window.location.replace|https://toshinaritanaka.github.io/history-quiz-app-v2/" apps/history-quiz-app-v2/index.html` を実行し、必要要素が存在することを確認。
- `git diff -- apps/history-quiz-app-v2/index.html docs/codex_report.md docs/project_status.md` で差分内容を確認。

## 注意点
- `apps/history-quiz-app-v2/index.html` は今後クイズ本体を持たない前提です。クイズ本体改修は `https://toshinaritanaka.github.io/history-quiz-app-v2/` 側で行ってください。
- `meta refresh` と JavaScript リダイレクトを併用しているため、通常ブラウザでは即時遷移します。

## 次にやるべきこと
- `dashboard.html` や他導線で `apps/history-quiz-app-v2/index.html` を案内する文言があれば、「互換用入口」であることを明記する。
- 将来的に互換期間が終了する場合は、この入口ページの扱い（維持/廃止）を決める。

## チャッピーに相談すべき点
- 旧URL互換ページをどの期間維持するか（恒久運用か、一定期間後廃止か）。
- GitHub Pages 側URL変更時の運用ルール（移転先URLの単一管理方法）。
