# テーブル一覧パネル実装タスク

仕様書: [spec/table_list_panel.md](spec/table_list_panel.md)

## 事前修正提案

なし（現時点でテストはすべてパス）

---

## フェーズ1: 型定義・Action層・テスト

### [ ] scheme/main.tsp の更新

- 編集対象: `scheme/main.tsp`
- `GlobalUIState` モデルに以下のフィールドを追加する
  ```
  showTableListPanel: boolean; // テーブル一覧パネル表示フラグ
  ```

### [ ] 型の再生成

- `npm run generate` を実行し、フロントエンド用・バックエンド用の型を再生成する
  - 出力先: `lib/generated/api-types.ts`, `public/src/api/client/models/GlobalUIState.ts`

### [ ] getInitialViewModelValues.ts の更新

- 編集対象: `public/src/utils/getInitialViewModelValues.ts`
- `getInitialGlobalUIState()` の戻り値に `showTableListPanel: false` を追加する

### [ ] actionToggleTableListPanel の実装

- 編集対象: `public/src/actions/globalUIActions.ts`
- 以下の関数を追加する
  - `actionToggleTableListPanel(vm: ViewModel): ViewModel`
    - `vm.ui.showTableListPanel` をトグルする
    - **パネルを開く場合**（`showTableListPanel` が `false → true`）: `showLayerPanel` を `false` にする（排他表示）
    - **パネルを閉じる場合**: `showLayerPanel` は変更しない
    - 変化がない場合は同一参照を返す

### [ ] actionToggleLayerPanel の修正（排他表示対応）

- 編集対象: `public/src/actions/layerActions.ts`
- 既存の `actionToggleLayerPanel` を修正する
  - **パネルを開く場合**（`showLayerPanel` が `false → true`）: `showTableListPanel` を `false` にする（排他表示）
  - **パネルを閉じる場合**: `showTableListPanel` は変更しない
- 参照: [spec/layer_management.md](spec/layer_management.md)

### [ ] テストコードの追加

- 編集対象: `public/tests/actions/globalUIActions.test.ts`
- 追加するテストケース:
  - `actionToggleLock`
    - `isLocked` が `false → true` に切り替わること
    - `isLocked` が `true → false` に切り替わること
    - 変化がない場合は同一参照を返すこと（`false → false` はあり得ないが、ロジック上の確認）
  - `actionToggleTableListPanel`
    - `showTableListPanel` が `false → true` に切り替わること
    - `showTableListPanel` が `true → false` に切り替わること
    - パネルを開く場合（`false → true`）、`showLayerPanel` が `false` になること（排他表示）
    - パネルを閉じる場合（`true → false`）、`showLayerPanel` は変更されないこと

- 編集対象: `public/tests/actions/layerActions.test.ts`
- 追加するテストケース:
  - `actionToggleLayerPanel`
    - パネルを開く場合（`false → true`）、`showTableListPanel` が `false` になること（排他表示）
    - パネルを閉じる場合（`true → false`）、`showTableListPanel` は変更されないこと

### [ ] フェーズ1 ビルド確認・テスト実行

- `npm run generate` → TypeScriptコンパイルエラーがないことを確認
- `npm run test` → テストがすべてパスすること

---

## フェーズ2: UIコンポーネント・翻訳

### [ ] ReactFlowProvider を App.tsx に移動

`TableListPanel` 内で `setCenter()` を使うには `ReactFlowProvider` のスコープ内である必要がある。
現状 `ERCanvas` 内に `ReactFlowProvider` があるため、`App.tsx` に移動する。

- 編集対象: `public/src/components/ERCanvas.tsx`
  - `ERCanvas`（外側ラッパー）から `<ReactFlowProvider>` と `</ReactFlowProvider>` を削除する
  - `ERCanvas` は `<ERCanvasInner>` を直接返すだけにする
  - `ReactFlowProvider` の import 削除

- 編集対象: `public/src/components/App.tsx`
  - `@xyflow/react` から `ReactFlowProvider` をインポートする
  - `<div className="app">` の内側全体を `<ReactFlowProvider>` でラップする

### [ ] TableListPanel コンポーネントの新規作成

- 新規作成: `public/src/components/TableListPanel.tsx`
- 実装内容（参照: [spec/table_list_panel.md](spec/table_list_panel.md)）:
  - `useReactFlow` の `setCenter()` でパンを実現する（ズームレベルは変更しない: `zoom` 引数に現在の `viewport.zoom` を渡す）
  - `useViewport()` で現在のズームレベルを取得する
  - ファジー検索の入力テキストはコンポーネントのローカル状態（`useState`）で管理する
  - テーブル一覧は `vm.erDiagram.nodes` から取得し、アルファベット順（昇順）にソートして表示する
  - ファジーマッチング:
    - 検索語とテーブル名を正規化（スペース・アンダースコアを除去し、小文字に統一）
    - 正規化後の検索語が正規化後のテーブル名の部分列（subsequence）であればマッチ
  - テーブル名クリック時:
    - `actionSelectItem(vm, { kind: 'entity', id: entityId })` をdispatch
    - `setCenter(node.x + node.width / 2, node.y + node.height / 2, { zoom: viewport.zoom, duration: 500 })` でパン
  - テーブルが存在しない場合は空状態メッセージを表示する
  - 翻訳キー名前空間: `table_list_panel`（詳細は翻訳ファイル追加タスクを参照）

### [ ] 翻訳ファイルの更新

- 編集対象: `public/locales/ja/translation.json`, `public/locales/en/translation.json`, `public/locales/zh/translation.json`
- 各ファイルに以下を追加する:

  **header セクション（テーブル一覧ボタン）**:
  - `header.table_list`: テーブル一覧 / Table List / 表列表

  **table_list_panel セクション（新規追加）**:
  - `table_list_panel.title`: テーブル一覧 / Table List / 表列表
  - `table_list_panel.filter_placeholder`: テーブル名で絞り込む / Filter by table name / 按表名筛选
  - `table_list_panel.empty`: テーブルが存在しません / No tables found / 没有表

### [ ] App.tsx の更新

- 編集対象: `public/src/components/App.tsx`
- 以下を追加・変更する:
  - `actionToggleTableListPanel` を `globalUIActions` からインポートする
  - `TableListPanel` コンポーネントをインポートする
  - `showTableListPanel` を `useViewModel` で購読する
  - ヘッダーのボタンに「テーブル一覧」ボタンを追加する
    - 配置順: レイヤーボタン（4番目）の直後（5番目）
    - クリック時: `dispatch(actionToggleTableListPanel)` を実行
    - アクティブ時の背景色: `showLayerPanel` のボタンと同様に `'#777'`
    - 翻訳キー: `t('header.table_list')`
  - 左サイドバー表示ロジックに `showTableListPanel` の分岐を追加する
    - `showTableListPanel` が `true` の場合に `<TableListPanel />` を `<LayerPanel />` と同じ幅・スタイルで左サイドバーに表示する

### [ ] フェーズ2 ビルド確認

- `npm run generate` → TypeScriptコンパイルエラーがないことを確認
- フロントエンドのビルドエラーがないことを確認（`public/src` 配下の TypeScript エラーをチェック）
