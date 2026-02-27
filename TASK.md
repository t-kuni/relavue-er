# テーブル一覧パネル実装タスク

仕様書: [spec/table_list_panel.md](spec/table_list_panel.md)

## 事前修正提案

なし（現時点でテストはすべてパス）

---

## フェーズ1: 型定義・Action層・テスト

### [x] scheme/main.tsp の更新

- 編集対象: `scheme/main.tsp`
- `GlobalUIState` モデルに以下のフィールドを追加する
  ```
  showTableListPanel: boolean; // テーブル一覧パネル表示フラグ
  ```

### [x] 型の再生成

- `npm run generate` を実行し、フロントエンド用・バックエンド用の型を再生成する
  - 出力先: `lib/generated/api-types.ts`, `public/src/api/client/models/GlobalUIState.ts`

### [x] getInitialViewModelValues.ts の更新

- 編集対象: `public/src/utils/getInitialViewModelValues.ts`
- `getInitialGlobalUIState()` の戻り値に `showTableListPanel: false` を追加する

### [x] actionToggleTableListPanel の実装

- 編集対象: `public/src/actions/globalUIActions.ts`
- 以下の関数を追加する
  - `actionToggleTableListPanel(vm: ViewModel): ViewModel`
    - `vm.ui.showTableListPanel` をトグルする
    - **パネルを開く場合**（`showTableListPanel` が `false → true`）: `showLayerPanel` を `false` にする（排他表示）
    - **パネルを閉じる場合**: `showLayerPanel` は変更しない
    - 変化がない場合は同一参照を返す

### [x] actionToggleLayerPanel の修正（排他表示対応）

- 編集対象: `public/src/actions/layerActions.ts`
- 既存の `actionToggleLayerPanel` を修正する
  - **パネルを開く場合**（`showLayerPanel` が `false → true`）: `showTableListPanel` を `false` にする（排他表示）
  - **パネルを閉じる場合**: `showTableListPanel` は変更しない
- 参照: [spec/layer_management.md](spec/layer_management.md)

### [x] テストコードの追加

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

### [x] フェーズ1 ビルド確認・テスト実行

- `npm run generate` → TypeScriptコンパイルエラーがないことを確認
- `npm run test` → テストがすべてパスすること（269 passed、ReverseEngineerUsecase は Docker未起動のため既存のスキップ）

---

## フェーズ2: UIコンポーネント・翻訳

### [x] ReactFlowProvider を App.tsx に移動

- 編集対象: `public/src/components/ERCanvas.tsx`
  - `ERCanvas`（外側ラッパー）から `<ReactFlowProvider>` と `</ReactFlowProvider>` を削除する
  - `ReactFlowProvider` の import 削除

- 編集対象: `public/src/components/App.tsx`
  - `@xyflow/react` から `ReactFlowProvider` をインポートする
  - `<div className="app">` の内側全体を `<ReactFlowProvider>` でラップする

### [x] TableListPanel コンポーネントの新規作成

- 新規作成: `public/src/components/TableListPanel.tsx`
- ファジーマッチング（subsequence方式）・setCenter によるパン・アルファベット順ソートを実装

### [x] 翻訳ファイルの更新

- 編集対象: `public/locales/ja/translation.json`, `public/locales/en/translation.json`, `public/locales/zh/translation.json`
- `header.table_list` と `table_list_panel` セクションを追加

### [x] App.tsx の更新

- `actionToggleTableListPanel` のインポートと `showTableListPanel` の購読を追加
- ヘッダーにテーブル一覧ボタンを追加（レイヤーボタンの直後）
- 左サイドバーに `<TableListPanel />` の条件付き表示を追加

### [x] フェーズ2 ビルド確認・テスト実行

- `npm run generate` → 正常に完了（TypeScriptエラーなし）
- `npm run test` → 269 passed、ReverseEngineerUsecase は Docker未起動のため既存のスキップ
