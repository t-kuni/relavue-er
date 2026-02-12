# タスク一覧

## フェーズ1: 型生成とバックエンド実装 ✅ 完了

### - [x] 型生成の実行

- コマンド: `npm run generate`
- 目的: `scheme/main.tsp`に追加された`isPanModeActive`フィールドを型定義に反映する
- 生成される対象ファイル:
  - `lib/generated/api-types.ts` (バックエンド用)
  - `public/src/api/client/index.ts` (フロントエンド用)
- ✅ 完了: 型生成が正常に完了しました

### - [x] バックエンド: GetInitialViewModelUsecaseの修正

- ファイル: `lib/usecases/GetInitialViewModelUsecase.ts`
- 修正内容:
  - `ERDiagramUIState`の初期化時に`isPanModeActive: false`を追加（38行目付近）
- 参照仕様: [viewmodel_based_api.md](spec/viewmodel_based_api.md)の初期値仕様
- ✅ 完了: 39行目に`isPanModeActive: false`を追加しました

### - [x] ビルドの確認

- コマンド: `npm run build` または TypeScriptのビルドコマンド
- 型エラーが発生しないことを確認
- ✅ 完了: ビルドが正常に完了しました

### - [x] テストの実行

- コマンド: `npm run test`
- バックエンドのテストが通過することを確認
- ✅ 完了: 全てのテスト（268件）が通過しました

## フェーズ2: フロントエンド実装 ✅ 完了

### - [x] getInitialViewModelValuesの修正

- ファイル: `public/src/utils/getInitialViewModelValues.ts`
- 修正内容:
  - `getInitialErDiagramUIState()`関数の戻り値に`isPanModeActive: false`を追加（17行目付近）
- 参照仕様: [viewmodel_based_api.md](spec/viewmodel_based_api.md)
- ✅ 完了: 18行目に`isPanModeActive: false`を追加しました

### - [x] importViewModelの修正

- ファイル: `public/src/utils/importViewModel.ts`
- 修正内容:
  - ViewModelインポート時の初期化処理に`isPanModeActive: false`を追加（144行目付近の`ui`オブジェクト）
  - 古いデータに`isPanModeActive`が存在しない場合のデフォルト値として`false`を設定
- 参照仕様: [import_export_feature.md](spec/import_export_feature.md)
- ✅ 完了: 145行目に`isPanModeActive: false`を追加しました

### - [x] exportViewModelの修正

- ファイル: `public/src/utils/exportViewModel.ts`
- 修正内容:
  - エクスポート時の初期化処理に`isPanModeActive: false`を追加（40行目付近の`ui`オブジェクト）
- 参照仕様: [import_export_feature.md](spec/import_export_feature.md)
- ✅ 完了: 41行目に`isPanModeActive: false`を追加しました

### - [x] hoverActionsの修正（パンモード対応）

- ファイル: `public/src/actions/hoverActions.ts`
- 修正内容:
  - `actionHoverEntity`関数: 冒頭に`isPanModeActive`チェックを追加し、trueの場合は早期リターン（76行目付近、`isDraggingEntity`チェックの直後）
  - `actionHoverEdge`関数: 冒頭に`isPanModeActive`チェックを追加し、trueの場合は早期リターン（132行目付近、`isDraggingEntity`チェックの直後）
  - `actionHoverColumn`関数: 冒頭に`isPanModeActive`チェックを追加し、trueの場合は早期リターン（196行目付近、`isDraggingEntity`チェックの直後）
  - 新規Actionの追加:
    - `actionSetPanModeActive(viewModel: ViewModel, isActive: boolean): ViewModel` - `isPanModeActive`を設定する
- 参照仕様: [frontend_er_rendering.md](spec/frontend_er_rendering.md)のパンモード仕様
- ✅ 完了: 各Hover関数の冒頭にパンモードチェックを追加し、新規Action `actionSetPanModeActive`を追加しました

### - [x] ERCanvasの修正（パンモード状態管理）

- ファイル: `public/src/components/ERCanvas.tsx`
- 修正内容:
  - Storeから`isPanModeActive`を購読する処理を追加（ERCanvasInner内）
    ```typescript
    const isPanModeActive = useViewModel((vm) => vm.erDiagram.ui.isPanModeActive)
    ```
  - スペースキー押下/解放時に`actionSetPanModeActive`をdispatchする処理を追加
    - `useEffect`フックでスペースキー状態の変化を監視
    - 押下時（false→true）: `dispatch(actionSetPanModeActive, true)`
    - 解放時（true→false）: `dispatch(actionSetPanModeActive, false)`
    - テキスト編集中は無視する（`editingTextId !== null`の場合は早期リターン）
  - 既存の`effectiveSpacePressed`によるホバークリア処理（283-287行目）を削除（不要になる）
  - `nodesDraggable`の制御を`effectiveSpacePressed`から`isPanModeActive`を参照するように変更（992行目）
  - 矩形・テキストのドラッグ無効化判定を`effectiveSpacePressed`から`isPanModeActive`を参照するように変更（411行目、605行目）
  - カーソルスタイルの制御:
    - `effectiveSpacePressed`の代わりに`spacePressed && !isPanModeActive`を使用してカーソル制御
    - または`isPanModeActive`を直接参照（実装時に判断）
- 注意事項:
  - テキスト編集中のスペースキー無効化は維持する（276-277行目）
  - ホイールボタンドラッグ時の処理は追加実装不要（既存のReact Flowのデフォルト機能で動作）
  - `effectiveSpacePressed`変数は削除しないが、用途を限定する（カーソル制御のみ）
- 参照仕様: [frontend_er_rendering.md](spec/frontend_er_rendering.md)のパンモード実装方針
- ✅ 完了: 全ての修正を実施し、`isPanModeActive`を直接参照するカーソル制御を採用しました

### - [x] dataActionsの修正（actionMergeERData）

- ファイル: `public/src/actions/dataActions.ts`
- 修正内容:
  - `actionMergeERData`関数: UI状態のクリア処理に`isDraggingEntity: false`と`isPanModeActive: false`を追加（556-559行目付近）
- 参照仕様: [incremental_reverse_engineering.md](spec/incremental_reverse_engineering.md)
- ✅ 完了: 558-559行目に`isDraggingEntity: false`と`isPanModeActive: false`を追加しました

### - [x] ビルドの確認

- コマンド: フロントエンドのビルドコマンド
- 型エラーやビルドエラーが発生しないことを確認
- ✅ 完了: `npm run build`が正常に完了しました

### - [x] テストの実行

- コマンド: `npm run test`
- 全てのテストが通過することを確認
- ✅ 完了: 全てのテスト（268件）が通過しました

## 補足事項

### 実装の考え方

- `isPanModeActive`はスペースキー押下状態やホイールボタンドラッグ状態を表す一時的なフラグ
- ViewModelで管理することで、ホバーActionの先頭で統一的にチェック可能になる
- エンティティ選択状態によるハイライトは`selectedItem`で別管理されているため、パンモード中も表示が維持される

### フェーズ分けの理由

- フェーズ1: 型生成とバックエンドのみ（変更が少ない）
- フェーズ2: フロントエンドの実装（複数ファイルの修正が必要）
- 各フェーズの最後にビルド・テストを実行することで、段階的に動作確認できる

### 動作確認の観点（手動確認時の参考）

1. スペースキー押下中にホバーイベントが無視されること
2. スペースキー押下中でもエンティティ選択によるハイライトは表示されたままであること
3. スペースキー押下中はエンティティ・矩形・テキストのドラッグが無効化されること
4. カーソルが`grab`/`grabbing`に変化すること
5. テキスト編集中のスペースキーは無視されること
6. JSONインポート時に古いデータでも正しく動作すること
