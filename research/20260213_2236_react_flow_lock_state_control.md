## 1. React Flow v12 における「toggle interactive」とは何か

* 「toggle interactive」は `<Controls />` にある “インタラクティブ切り替え（ロック）” ボタンで、`showInteractive`（デフォルト `true`）で表示されます。押下時は `onInteractiveChange(interactiveStatus: boolean)` が呼ばれます。([React Flow][1])
* v12 の実装上、このボタンが切り替えるのは **`nodesDraggable` / `nodesConnectable` / `elementsSelectable` の3つだけ**です（内部ストアの値をまとめて反転）。`panOnDrag` や `zoomOnScroll` など **ビュー操作系は切り替え対象ではありません**。([GitHub][2])

React Flow v12 のインタラクティブ制御は主に `<ReactFlow />` の “Interaction props” で行います（例）:

* ノード/エッジ系: `nodesDraggable`, `nodesConnectable`, `elementsSelectable`, `nodesFocusable`, `edgesFocusable`([React Flow][3])
* ビュー操作系: `panOnDrag`, `panOnScroll`, `zoomOnScroll`, `zoomOnPinch`, `zoomOnDoubleClick` など([React Flow][3])
* 公式の “Interaction Props” サンプルでも、これらの props を状態で切り替える例が示されています。([React Flow][4])

---

## 2. ViewportPortal で描画された要素へのインタラクティブ制御方法

`<ViewportPortal />` は **ノード/エッジと同じ座標系に従い、ズーム・パンの影響を受ける**場所に任意コンポーネントを描画するためのものです。([React Flow][5])

一方で、`toggle interactive` や `<ReactFlow />` の `nodesDraggable` / `elementsSelectable` 等は **React Flow が管理するノード/エッジの挙動**を制御するためのものなので、**ViewportPortal 内の独自DOM（矩形・テキスト）には自動では効きません**（＝独自に制御が必要、という整理になります）。([React Flow][5])

---

## 3. ロック状態の実装方法 ⚠ 意思決定が必要です

### 選択肢A: React Flow の props だけで制御

* ノード/エッジの操作（ドラッグ/接続/選択）は止められます。([React Flow][3])
* ただし **ViewportPortal の矩形/テキスト操作は止まりません**（問題が残る）。

### 選択肢B: `isLocked` を追加してイベントで早期リターン

* すでにパンモードでやっているのと同じ方式で、`isLocked` も条件に足すだけで止められます（ドラッグ、リサイズ開始、ダブルクリック編集開始など）。

### 選択肢C: CSS `pointer-events: none`

* 矩形/テキスト群を包むコンテナに `pointer-events: none` を付けると、**マウス/タッチ操作が丸ごと無効**になります（下の React Flow 側へイベントが抜ける）。
* ただし「すでにフォーカス済みの入力」などはポインタ以外で継続し得るので、ロックON時に **編集UI自体を閉じる/出さない**等を併用した方が安全です。

### 選択肢D: 組み合わせ

* 実装を最小にするなら **D（A + C を基本に、Bを保険で併用）**が一番手堅いです。

  * React Flow: ノード/エッジ操作は props でロック
  * ViewportPortal: コンテナ `pointer-events` で一括ロック
  * 既存の `onMouseDown` 早期returnにも `isLocked` を追加（ドラッグ途中などの端ケース対策）

実装イメージ（最小差分）:

```tsx
const isLocked = erDiagram.ui.isLocked;

<ReactFlow
  nodesDraggable={!isPanModeActive && !isLocked}
  nodesConnectable={!isLocked}
  elementsSelectable={!isLocked}
  panOnDrag={true}
  ...
>
  <ViewportPortal>
    <div style={{ pointerEvents: isLocked ? 'none' : 'auto' }}>
      {renderRectangles(...)}
      {renderTexts(...)}
    </div>
  </ViewportPortal>

  {(!isLocked && editingTextId && texts[editingTextId]) && (
    <ViewportPortal>{/* テキスト編集UI */}</ViewportPortal>
  )}
</ReactFlow>
```

※ `toggle interactive`（`<Controls />` のボタン）をそのまま使う場合は、`onInteractiveChange` の `interactiveStatus`（true/false）を受けて `isLocked = !interactiveStatus` を同期し、ViewportPortal側の `pointer-events` に反映させる方針になります。([React Flow][1])
（ただし `<Controls />` 側は内部ストアの3項目しか切り替えない点は前提です。([GitHub][2])）

---

## 4. ロック状態の保存場所 ⚠ 意思決定が必要です

### 選択肢A: `ViewModel.ui` or `ViewModel.erDiagram.ui` に追加（グローバルロック）

* 要件（矩形/テキスト/ノード等を一括で編集不可）に素直に合います。
* “ER図キャンバスのロック” は図面単位のUI状態なので、配置としては `erDiagram.ui` が自然です（あなたの既存 `isPanModeActive` 等と同じレイヤ）。

### 選択肢B: 各矩形・テキストごとに `isLocked`

* 「一部だけロック」など将来拡張には良いですが、現要件だと実装とデータ更新箇所が増えます。

### 選択肢C: 矩形・テキストには保存せずエンティティノードだけ

* 要件を満たしません（矩形/テキストも編集不可にしたい）。

---

## 5. インポート時・画面初期表示時のロック状態制御方法

* **画面初期表示（初期化時）**: `isLocked = false`（ロック解除）でストア初期値を作る。
* **インポート直後**: `actionSetViewModel(imported)` の後に、**明示的に `isLocked = true` を上書き**する。

  * 「インポート時に一時UI状態は初期化」の設計なら、**“初期化が終わった直後” に `isLocked=true` をセット**するのが確実です（初期化に上書きされないため）。

---

## 6. React Flow v12 のベストプラクティスと関連ドキュメント

* インタラクティブ制御は `<ReactFlow />` の “Interaction props” で行う（公式の props 一覧と説明）。([React Flow][3])
* 公式の “Interaction Props” 例（状態で各種 interactivity を切り替えるパターン）。([React Flow][4])
* `<Controls />` の `showInteractive` / `onInteractiveChange`（ロックボタンのフック）。([React Flow][1])
* `<Controls />` は `<ControlButton />` で拡張できる（独自ロックボタン実装の根拠）。([React Flow][1])
* `<ViewportPortal />` は「同一ビューポートに任意コンポーネントを載せる」用途（ズーム/パン追従の根拠）。([React Flow][5])

---

## 7. パフォーマンスと副作用の考慮

* ロック切替が頻繁でも、基本は boolean の切替なので負荷は小さいです（React Flow 側は interactivity のフラグ更新＋再描画、ViewportPortal 側は `pointer-events` 切替）。([React Flow][3])
* 副作用を減らす観点では、矩形/テキスト個々に `disabled` を配るより、**ViewportPortal直下のコンテナ1枚に `pointer-events` を当てる**方が更新範囲が小さくなります。

[1]: https://reactflow.dev/api-reference/components/controls "The Controls component - React Flow"
[2]: https://raw.githubusercontent.com/xyflow/xyflow/main/packages/react/src/additional-components/Controls/Controls.tsx "raw.githubusercontent.com"
[3]: https://reactflow.dev/api-reference/react-flow "The ReactFlow component - React Flow"
[4]: https://reactflow.dev/examples/interaction/interaction-props "Interaction Props - React Flow"
[5]: https://reactflow.dev/api-reference/components/viewport-portal "The ViewportPortal component - React Flow"


------------------


追加の要件です。

* ロックを切り替えるボタンはReact Flowのデフォルトのtoggle intaractiveボタンに相乗りする
* ロック切り替えにショートカットを割り当てたい。デフォルトでショートカットキーが割り当てられているか？


--------------------

### 1) デフォルトの “toggle interactivity” ボタンに相乗りする方法

`<Controls />` の `onInteractiveChange(interactiveStatus: boolean)` で、デフォルトのロックボタン押下をフックできます。([React Flow][1])
この `interactiveStatus`（インタラクティブ有効/無効）をあなたの `isLocked` に同期し、**React Flow の props** と **ViewportPortal 側の pointer-events / 編集UI表示**を同じ状態で切り替えれば相乗りできます。

* 例（概念）: `isLocked = !interactiveStatus`
* 反映先:

  * `<ReactFlow />`: `nodesDraggable / nodesConnectable / elementsSelectable` などを `!isLocked` で制御
  * `<ViewportPortal />`: まとめて包む要素に `pointer-events: none`（ロック中）を適用、編集UIはロック中表示しない

※ `Controls` のロックボタンが切り替える対象は「インタラクション（選択/ドラッグ/接続）」で、コールバックも“クリック時”に発火します。([React Flow][1])

---

### 2) ロック切り替えのショートカットはデフォルトであるか？

**専用のデフォルトショートカットは用意されていません。**
React Flow がデフォルトで持つ “Keyboard props” は `deleteKeyCode / selectionKeyCode / multiSelectionKeyCode / zoomActivationKeyCode / panActivationKeyCode` 等で、ロック切り替えに対応する項目はありません。([React Flow][2])

ただし、キーボード操作としては **Tab でフォーカス移動 → Enter/Space で操作**は可能です（アクセシビリティ機能）。([React Flow][3])

ショートカットを割り当てる場合は、`useKeyPress` などで任意のキー入力を検知して、上記の `isLocked`（または `interactiveStatus` 相当の状態）をトグルする実装になります。([React Flow][4])

[1]: https://reactflow.dev/api-reference/components/controls "The Controls component - React Flow"
[2]: https://reactflow.dev/api-reference/react-flow "The ReactFlow component - React Flow"
[3]: https://reactflow.dev/learn/advanced-use/accessibility "Accessibility - React Flow"
[4]: https://reactflow.dev/api-reference/hooks/use-key-press "useKeyPress() - React Flow"
