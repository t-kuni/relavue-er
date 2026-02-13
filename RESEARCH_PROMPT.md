# リサーチプロンプト: React Flow のロック状態における矩形・テキスト編集制御

## リサーチ目的

React Flowのtoggle interactiveをロック状態にしてもオブジェクト（テキストや矩形）が編集できてしまう。React Flowのtoggle interactiveをロック状態にするとオブジェクト（テキストや矩形）を編集できないようにする。これの実現方法を調査する。
また、インポートした直後はロック状態にする。
画面を開いた直後はロック解除状態とする

## プロジェクト概要

### アプリケーション名
ER Diagram Viewer

### アプリケーションの目的
RDBからER図をリバースエンジニアリングし、ブラウザ上で視覚的に表示・編集できるWebアプリケーション。

### 開発フェーズ
- プロトタイピング段階
- MVPを作成中
- 実現可能性を検証したいのでパフォーマンスやセキュリティは考慮しない

### 使用技術スタック
- フロントエンド: React
- 図形描画ライブラリ: @xyflow/react v12 (React Flow)
- 状態管理: カスタムストア（Flux-likeアーキテクチャ、ViewModelベース）

## 現在の実装状況

### React Flow の設定
- React Flow v12 (@xyflow/react) を使用
- 以下のpropsを設定している:
  - `nodesDraggable={!isPanModeActive}`: パンモード時にノードのドラッグを無効化
  - `panOnDrag={true}`: 背景ドラッグによるパンを有効化
  - その他: `elevateNodesOnSelect={false}`, `elevateEdgesOnSelect={false}`, `zIndexMode="manual"`, `fitView`

### 描画要素の構成
1. **エンティティノード**: React Flowのノードとして実装（カスタムノードタイプ `entityNode`）
2. **リレーションエッジ**: React Flowのエッジとして実装
3. **矩形（Rectangles）**: `ViewportPortal` を使用してReact Flow外で描画
4. **テキストボックス（Texts）**: `ViewportPortal` を使用してReact Flow外で描画

### 矩形とテキストの描画コード（ERCanvas.tsx より抜粋）
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  nodesDraggable={!isPanModeActive}
  panOnDrag={true}
  fitView
>
  {/* 背面レイヤー */}
  <ViewportPortal>
    {renderRectangles(layerOrder.backgroundItems)}
    {renderTexts(layerOrder.backgroundItems)}
  </ViewportPortal>
  
  {/* 前面レイヤー */}
  <ViewportPortal>
    {renderRectangles(layerOrder.foregroundItems)}
    {renderTexts(layerOrder.foregroundItems)}
  </ViewportPortal>
  
  {/* テキスト編集UI */}
  {editingTextId && texts[editingTextId] && (
    <ViewportPortal>
      {/* テキスト編集コンポーネント */}
    </ViewportPortal>
  )}
</ReactFlow>
```

### パンモードの実装
- `erDiagram.ui.isPanModeActive` というboolean状態でパンモードを管理
- スペースキー押下中またはホイールボタンドラッグ中に `true`
- パンモード中は：
  - エンティティのドラッグが無効化される（`nodesDraggable: false`）
  - 矩形・テキストのドラッグが無効化される（`onMouseDown`イベントで早期リターン）

### インポート・エクスポート機能
- ViewModel を JSON 形式でエクスポート・インポート
- インポート時は `actionSetViewModel` で ViewModel を Store に設定
- エクスポート時・インポート時に一時UI状態は初期化される

### ViewModel の構造（scheme/main.tsp より）
```typescript
interface ViewModel {
  format: string;
  version: number;
  erDiagram: ERDiagram;
  settings: Settings;
  ui: GlobalUIState;
  buildInfo: BuildInfo;
}

interface ERDiagram {
  nodes: Record<string, EntityNode>;
  edges: Record<string, RelationEdge>;
  rectangles: Record<string, RectangleItem>;
  texts: Record<string, TextBoxItem>;
  index: ERDiagramIndex;
  ui: ERDiagramUIState;
  loading: boolean;
}

interface ERDiagramUIState {
  hover: HoverState | null;
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  highlightedColumnIds: string[];
  isDraggingEntity: boolean;
  isPanModeActive: boolean;
  layerOrder: LayerOrder;
}
```

## 現在の問題

### 問題の詳細
- React Flow の「toggle interactive（インタラクティブ切り替え）」をロック状態にしても、矩形とテキストが編集できてしまう
- 矩形とテキストは React Flow のノードではなく、`ViewportPortal` を使って描画されているため、React Flow の `nodesDraggable` などのプロパティが影響しない可能性がある

### 期待する動作
1. **ロック状態**: 矩形とテキストの編集（ドラッグ、サイズ変更、テキスト編集など）を完全に無効化
2. **ロック解除状態**: 矩形とテキストの編集を可能にする
3. **画面を開いた直後**: ロック解除状態
4. **インポート直後**: ロック状態

## リサーチ観点

以下の観点について調査してください。各観点に連番を付与し、複数の選択肢がある場合は「⚠ 意思決定が必要です」と記載してください。

1. **React Flow v12 における「toggle interactive」とは何か**
   - React Flow v12 で提供されているインタラクティブ制御のプロパティは何か
   - `nodesDraggable`, `nodesConnectable`, `elementsSelectable` など、どのようなプロパティがあるか
   - それぞれのプロパティがどの要素に影響を与えるか

2. **ViewportPortal で描画された要素へのインタラクティブ制御方法**
   - `ViewportPortal` を使って描画された矩形・テキストは、React Flow のインタラクティブプロパティの影響を受けるか
   - 受けない場合、独自にインタラクティブ制御を実装する必要があるか

3. **ロック状態の実装方法** ⚠ 意思決定が必要です
   - 選択肢A: React Flow のプロパティ（`nodesDraggable`, `elementsSelectable` など）を組み合わせて制御
   - 選択肢B: ViewModelに `isLocked` のような状態を追加し、矩形・テキストのイベントハンドラで早期リターンさせる
   - 選択肢C: CSSの `pointer-events: none` を使用してインタラクションを無効化
   - 選択肢D: 上記の組み合わせ

4. **ロック状態の保存場所** ⚠ 意思決定が必要です
   - 選択肢A: `ViewModel.ui` または `ViewModel.erDiagram.ui` に追加（グローバルなロック状態として管理）
   - 選択肢B: 各矩形・テキストごとに `isLocked` プロパティを持たせる（個別のロック状態として管理）
   - 選択肢C: 矩形・テキストには保存せず、エンティティノードだけをロック対象とする

5. **インポート時・画面初期表示時のロック状態制御方法**
   - インポート直後にロック状態にするためには、どのタイミングで状態を変更すべきか
   - 画面を開いた直後（初期化時）にロック解除状態にするためには、どのタイミングで状態を変更すべきか
   - これらの制御をどのように実装するのが適切か

6. **React Flow v12 のベストプラクティスと関連ドキュメント**
   - React Flow v12 の公式ドキュメントで、インタラクティブ制御に関する推奨パターンはあるか
   - `ViewportPortal` を使った要素のインタラクティブ制御に関する事例やサンプルはあるか

7. **パフォーマンスと副作用の考慮**
   - ロック状態の切り替えが頻繁に行われる場合のパフォーマンス影響
   - React Flow の再レンダリングへの影響

## 関連ファイル

- 実装ファイル: `public/src/components/ERCanvas.tsx`
- 仕様書: `spec/frontend_er_rendering.md`
- 仕様書: `spec/import_export_feature.md`
- 仕様書: `spec/frontend_state_management.md`
- 型定義: `scheme/main.tsp`

## 補足情報

- プロトタイピング段階のため、パフォーマンスやセキュリティは考慮しない
- シンプルで実装しやすい方法を優先
- 現在の実装を大きく変更する必要がある場合は、その旨を明記すること
