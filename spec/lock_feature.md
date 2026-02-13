# ロック機能仕様

## 概要

React Flowのtoggle interactiveボタンと連動して、ER図キャンバス上のすべてのオブジェクト（エンティティノード、矩形、テキスト）の編集を一括で禁止/許可する機能。

## 背景

React Flowの`<Controls />`コンポーネントにあるtoggle interactiveボタンは、`nodesDraggable`/`nodesConnectable`/`elementsSelectable`の3つのプロパティを切り替えるが、`ViewportPortal`で描画された矩形・テキストには自動で効かない。そのため、独自にロック状態を管理して矩形・テキストのインタラクションも制御する必要がある。

リサーチレポート: [research/20260213_2236_react_flow_lock_state_control.md](/research/20260213_2236_react_flow_lock_state_control.md)

## ロック状態の定義

### データ構造

ロック状態は`ERDiagramUIState`に`isLocked: boolean`フィールドを追加する（[scheme/main.tsp](/scheme/main.tsp)で定義）。

- `isLocked: true` - ロック状態（編集不可）
- `isLocked: false` - ロック解除状態（編集可能）

### 初期値

- **画面を開いた直後（初期化時）**: `isLocked = false`（ロック解除状態）
- **インポート直後**: `isLocked = true`（ロック状態）
  - インポート時にファイルに`isLocked`フィールドが存在しない場合もデフォルト値`true`を設定する

## ロック状態による制御

### React Flowのノード・エッジ

React Flowの`<ReactFlow />`コンポーネントのインタラクションプロパティをロック状態と連動させる:

- `nodesDraggable={!isPanModeActive && !isLocked}` - ロック時はノードのドラッグを無効化
- `nodesConnectable={!isLocked}` - ロック時はノードの接続を無効化
- `elementsSelectable={!isLocked}` - ロック時は要素の選択を無効化

### ViewportPortalで描画された矩形・テキスト

`ViewportPortal`内の矩形・テキストを包むコンテナに対して、ロック状態に応じて`pointer-events`を制御する:

- `isLocked = true`の場合: `pointer-events: none`を適用
  - すべてのマウス操作を無効化（クリック、ドラッグ、リサイズ）
  - 選択もできない（クリックイベント自体が発火しない）
  - プロパティパネルも表示されない
- `isLocked = false`の場合: `pointer-events: auto`を適用（マウス操作を有効化）

### イベントハンドラーでの早期リターン（保険）

`pointer-events: none`で基本的にイベントは発火しないが、念のため矩形・テキストの各種イベントハンドラーでも`isLocked`をチェックして早期リターンする:

- `onMouseDown`: ドラッグ/リサイズ開始時に`isLocked`がtrueなら早期リターン
- `onDoubleClick`: テキスト編集開始時に`isLocked`がtrueなら早期リターン
- `onClick`: 選択時に`isLocked`がtrueなら早期リターン

パンモード（`isPanModeActive`）でも同様の制御を行っているため、同じパターンで実装する。

### テキスト編集UIの表示制御

ロック状態時はテキスト編集UI（`ViewportPortal`内のtextarea）を表示しない:

```typescript
{(!isLocked && editingTextId && texts[editingTextId]) && (
  <ViewportPortal>{/* テキスト編集UI */}</ViewportPortal>
)}
```

## React Flow Controls との連動

React Flowの`<Controls />`コンポーネントの`onInteractiveChange`コールバックを使用して、デフォルトのtoggle interactiveボタンの押下をフックする:

- `onInteractiveChange(interactiveStatus: boolean)`が呼ばれたら、`isLocked = !interactiveStatus`として状態を同期する
- `actionToggleLock(viewModel)`アクションを実装して、`isLocked`をトグルする

実装時の注意:
- `<Controls />`のtoggle interactiveボタンが切り替えるのは`nodesDraggable`/`nodesConnectable`/`elementsSelectable`の3つだけ（React Flow v12の仕様）
- `panOnDrag`や`zoomOnScroll`などのビュー操作系プロパティは切り替え対象ではない

## キーボードショートカット

ロック状態を切り替えるキーボードショートカットを実装する:

### ショートカットキー

- **Windows/Linux**: `Ctrl + E`
- **macOS**: `Cmd + E`

### 実装方法

React Flowの`useKeyPress`フックを使用してキー入力を検知:

- `useKeyPress('Control+e')`と`useKeyPress('Meta+e')`の両方を監視
- キーが押された瞬間（エッジ検知: `false → true`）に`actionToggleLock`をdispatch
- 前回のキー押下状態を`useRef`で追跡し、重複実行を防ぐ
- ブラウザのデフォルト動作（検索バー/アドレスバーへのフォーカス）は`event.preventDefault()`で抑制

### 無効化条件

以下の場合、キーボードショートカットを無効化する:

- **テキスト編集モード中**: キャンバス上でテキスト編集中（`editingTextId !== null`）の場合
- **HTML入力要素にフォーカスがある場合**: `<input>`, `<textarea>`, `contenteditable`要素にフォーカスがある場合
  - プロパティパネルのinput/textarea要素でのテキスト編集時は、ブラウザのデフォルト動作を優先
  - 実装方法: `document.activeElement`をチェックし、HTMLInputElement、HTMLTextAreaElement、またはcontenteditable要素の場合はキーボードショートカットを無視

実装パターンは[コピー&ペースト機能仕様](/spec/copy_paste_feature.md)のキーボードショートカット実装を参考にする。

### キーボードショートカットの状態管理

コピー&ペースト機能と同様のパターンで実装する:

- 前回のキー押下状態の更新は、早期リターンの**前**に実行する
- これにより、テキスト編集終了後もキーボードショートカットが正常に動作する

詳細は[コピー&ペースト機能仕様](/spec/copy_paste_feature.md)の「キーボードショートカットの状態管理」を参照。

## インポート・エクスポート時の処理

### エクスポート時

`isLocked`フィールドは一時UI状態なので、エクスポート時に初期値（`false`）に戻す。

詳細は[インポート・エクスポート機能仕様](/spec/import_export_feature.md)を参照。

### インポート時

インポートしたファイルに`isLocked`フィールドが**存在しない場合**、デフォルト値として`isLocked = true`を設定する（インポート直後はロック状態にする要件を満たすため）。

インポートしたファイルに`isLocked`フィールドが**存在する場合**でも、常に`isLocked = true`で上書きする（インポート直後は必ずロック状態にするため）。

詳細は[インポート・エクスポート機能仕様](/spec/import_export_feature.md)を参照。

## Action層の設計

### 新規Action

- `actionToggleLock(viewModel)`: ロック状態をトグルする
  - `viewModel.erDiagram.ui.isLocked`を反転させる
  - 変化がない場合は同一参照を返す（再レンダリング抑制）

### 既存Actionの修正

インポート・エクスポート関連のActionを修正して、`isLocked`の処理を追加する。

詳細は[フロントエンド状態管理仕様](/spec/frontend_state_management.md)を参照。

## 関連仕様書

- [フロントエンド状態管理仕様](/spec/frontend_state_management.md) - Storeとアクションの設計
- [インポート・エクスポート機能仕様](/spec/import_export_feature.md) - インポート/エクスポート時の処理
- [コピー&ペースト機能仕様](/spec/copy_paste_feature.md) - キーボードショートカットの実装パターン
- [scheme/main.tsp](/scheme/main.tsp) - データ型定義
- [research/20260213_2236_react_flow_lock_state_control.md](/research/20260213_2236_react_flow_lock_state_control.md) - リサーチレポート
