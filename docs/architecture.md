# Architecture

## 構成概要
- ルートの `dashboard.html` から各学習アプリへ遷移するポータル構成。
- 歴史アプリは以下の2系統を並行運用。
  - 基礎版: `trial-history.html`（外部 GitHub Pages へリダイレクト）
  - v2 開発版: `apps/history-quiz-app-v2/index.html`（本リポジトリ内静的配信）

## v2 アプリ配置方針
- `apps/history-quiz-app-v2/` 配下に HTML/CSS/JS/データを同居。
- 参照パスはすべて相対パスで解決し、GitHub Pages でも動作するようにする。
