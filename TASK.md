# ロック機能実装タスク

本タスクは、React Flowのtoggle interactiveボタンと連動して、ER図キャンバス上のすべてのオブジェクト（エンティティノード、矩形、テキスト）の編集を一括で禁止/許可するロック機能を実装するものです。

**参照仕様書**: [spec/lock_feature.md](./spec/lock_feature.md)

## 型生成

- [x] 型の再生成
  - **コマンド**: `npm run generate`
  - **目的**: `scheme/main.tsp`の`ERDiagramUIState`に追加された`isLocked`フィールドから型定義を生成
  - **生成されるファイル**: `lib/generated/api-types.ts`, `public/src/api/client/index.ts`

## バックエンド実装

- [x] 初期ViewModelに`isLocked`フィールドを追加
  - **ファイル**: `lib/usecases/GetInitialViewModelUsecase.ts`
  - **変更内容**: `getInitialErDiagramUIState`関数で返すオブジェクトに`isLocked: false`を追加
    ```typescript
    const erDiagramUIState: ERDiagramUIState = {
      hover: null,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      highlightedColumnIds: [],
      layerOrder,
      isDraggingEntity: false,
      isPanModeActive: false,
      isLocked: false, // 追加
    };
    ```
  - **参照**: [spec/viewmodel_based_api.md](./spec/viewmodel_based_api.md) - `/api/init`の初期値
  - **参照**: [spec/lock_feature.md](./spec/lock_feature.md) - ロック状態の初期値

## フロントエンド実装

### ユーティリティ層の実装

- [x] 初期状態に`isLocked`を追加
  - **ファイル**: `public/src/utils/getInitialViewModelValues.ts`
  - **関数**: `getInitialErDiagramUIState`
  - **変更内容**: 返却するオブジェクトに`isLocked: false`を追加
    ```typescript
    export function getInitialErDiagramUIState(): ERDiagramUIState {
      return {
        hover: null,
        highlightedNodeIds: [],
        highlightedEdgeIds: [],
        highlightedColumnIds: [],
        layerOrder: {
          backgroundItems: [],
          foregroundItems: [],
        },
        isDraggingEntity: false,
        isPanModeActive: false,
        isLocked: false, // 追加
      };
    }
    ```
  - **参照**: [spec/lock_feature.md](./spec/lock_feature.md) - ロック状態の初期値

- [x] エクスポート時に`isLocked`を初期化
  - **ファイル**: `public/src/utils/exportViewModel.ts`
  - **関数**: `exportViewModel`
  - **変更内容**: エクスポート時に`isLocked: false`を設定
    ```typescript
    ui: {
      hover: null,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      highlightedColumnIds: [],
      layerOrder: viewModel.erDiagram.ui.layerOrder,
      isDraggingEntity: false,
      isPanModeActive: false,
      isLocked: false, // 追加
    },
    ```
  - **参照**: [spec/import_export_feature.md](./spec/import_export_feature.md) - エクスポート時の処理
  - **参照**: [spec/lock_feature.md](./spec/lock_feature.md) - インポート・エクスポート時の処理

- [x] インポート時に`isLocked`を設定
  - **ファイル**: `public/src/utils/importViewModel.ts`
  - **関数**: `importViewModel`
  - **変更内容**: インポート時に`isLocked: true`を設定（インポート直後はロック状態にする）
    ```typescript
    ui: {
      hover: null,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      highlightedColumnIds: [],
      layerOrder:
        importedViewModel.erDiagram?.ui?.layerOrder || {
          backgroundItems: [],
          foregroundItems: [],
        },
      isDraggingEntity: false,
      isPanModeActive: false,
      isLocked: true, // 追加（インポート直後はロック状態）
    },
    ```
  - **参照**: [spec/import_export_feature.md](./spec/import_export_feature.md) - インポート時の処理
  - **参照**: [spec/lock_feature.md](./spec/lock_feature.md) - インポート・エクスポート時の処理

### アクション層の実装

- [x] ロック状態トグルアクションの実装
  - **ファイル**: `public/src/actions/globalUIActions.ts`
  - **新規関数**: `actionToggleLock`
  - **シグネチャ**: `actionToggleLock(viewModel: ViewModel): ViewModel`
  - **動作**: `viewModel.erDiagram.ui.isLocked`を反転させる
  - **実装内容**:
    ```typescript
    /**
     * ロック状態をトグルする
     */
    export function actionToggleLock(
      viewModel: ViewModel
    ): ViewModel {
      const newIsLocked = !viewModel.erDiagram.ui.isLocked;
      
      // 変化がない場合は同一参照を返す（再レンダリング抑制）
      if (viewModel.erDiagram.ui.isLocked === newIsLocked) {
        return viewModel;
      }
      
      return {
        ...viewModel,
        erDiagram: {
          ...viewModel.erDiagram,
          ui: {
            ...viewModel.erDiagram.ui,
            isLocked: newIsLocked,
          },
        },
      };
    }
    ```
  - **参照**: [spec/frontend_state_management.md](./spec/frontend_state_management.md) - Action層の設計
  - **参照**: [spec/lock_feature.md](./spec/lock_feature.md) - Action層の設計

### UI層の実装

- [x] ERCanvasコンポーネントにロック機能を実装
  - **ファイル**: `public/src/components/ERCanvas.tsx`
  - **変更内容**: 以下の実装を追加

  **1. ロック状態の購読**:
  ```typescript
  const isLocked = useViewModel((vm) => vm.erDiagram.ui.isLocked)
  ```

  **2. React Flowコンポーネントのプロパティ設定**:
  - `ERCanvasInner`コンポーネント内の`<ReactFlow>`コンポーネントのプロパティを修正
  ```typescript
  <ReactFlow
    // ... 既存のプロパティ ...
    nodesDraggable={!isPanModeActive && !isLocked}  // 修正
    nodesConnectable={!isLocked}  // 追加
    elementsSelectable={!isLocked}  // 追加
    // ... 既存のプロパティ ...
  >
  ```

  **3. React Flow Controlsのロック状態連動**:
  - `<Controls>`コンポーネントに`onInteractiveChange`コールバックを追加
  ```typescript
  <Controls 
    onInteractiveChange={(interactiveStatus) => {
      dispatch(actionToggleLock, undefined)  // interactiveStatusの反転がisLockedに対応
    }}
  />
  ```

  **4. ViewportPortal内の矩形・テキストのpointer-events制御**:
  - 矩形とテキストを包むコンテナに`pointer-events`を追加
  ```typescript
  // renderRectangles関数内
  <div
    style={{
      position: 'absolute',
      left: rectangle.x,
      top: rectangle.y,
      width: rectangle.width,
      height: rectangle.height,
      // ... 既存のスタイル ...
      pointerEvents: isLocked ? 'none' : 'auto',  // 追加
    }}
    // ... イベントハンドラー ...
  >
  
  // renderTexts関数内
  <div
    style={{
      position: 'absolute',
      left: text.x,
      top: text.y,
      width: text.width,
      height: text.height,
      // ... 既存のスタイル ...
      pointerEvents: isLocked ? 'none' : 'auto',  // 追加
    }}
    // ... イベントハンドラー ...
  >
  ```

  **5. 矩形・テキストのイベントハンドラーに早期リターンを追加**:
  - `handleRectangleMouseDown`関数に早期リターンを追加
  ```typescript
  const handleRectangleMouseDown = useCallback((e: React.MouseEvent, rectangleId: string) => {
    if (isLocked) return  // 追加
    if (isPanModeActive) return
    // ... 既存の処理 ...
  }, [rectangles, dispatch, isPanModeActive, isLocked])  // 依存配列にisLockedを追加
  ```
  - `handleTextMouseDown`関数に早期リターンを追加
  ```typescript
  const handleTextMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    if (isLocked) return  // 追加
    if (isPanModeActive) return
    // ... 既存の処理 ...
  }, [texts, dispatch, isPanModeActive, isLocked])  // 依存配列にisLockedを追加
  ```
  - renderTexts関数内の`onDoubleClick`ハンドラーに早期リターンを追加
  ```typescript
  onDoubleClick={(e) => {
    if (isLocked) return  // 追加
    e.stopPropagation()
    setEditingTextId(item.id)
    setDraftContent(text.content)
  }}
  ```

  **6. テキスト編集UIの表示制御**:
  - テキスト編集UI（ViewportPortal内のtextarea）を条件付きレンダリング
  ```typescript
  {(!isLocked && editingTextId && texts[editingTextId]) && (
    <ViewportPortal>
      {/* テキスト編集UI */}
    </ViewportPortal>
  )}
  ```

  **7. キーボードショートカット（Ctrl+E / Cmd+E）の実装**:
  - ロック状態をトグルするキーボードショートカットを実装
  ```typescript
  // キーボードショートカット: ロック状態トグル
  const ctrlEPressed = useKeyPress('Control+e')
  const metaEPressed = useKeyPress('Meta+e')
  
  // 前回のキー押下状態を保持（エッジ検知用）
  const prevCtrlEPressed = useRef(false)
  const prevMetaEPressed = useRef(false)
  
  // ロックトグル処理（キーが押された瞬間だけ実行）
  useEffect(() => {
    // 前回の状態を保存（早期リターンより前に実行）
    const prevCtrlE = prevCtrlEPressed.current
    const prevMetaE = prevMetaEPressed.current
    
    // 前回の状態を更新
    prevCtrlEPressed.current = ctrlEPressed
    prevMetaEPressed.current = metaEPressed
    
    // テキスト編集モード中は無効化
    if (editingTextId !== null) return
    
    // HTML入力要素にフォーカスがある場合は無効化（ブラウザのデフォルト動作を優先）
    const activeElement = document.activeElement
    const isInputElement = 
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      (activeElement instanceof HTMLElement && activeElement.isContentEditable)
    if (isInputElement) return
    
    // false → true の変化を検知（キーが押された瞬間）
    const ctrlEJustPressed = !prevCtrlE && ctrlEPressed
    const metaEJustPressed = !prevMetaE && metaEPressed
    
    if (ctrlEJustPressed || metaEJustPressed) {
      // ブラウザのデフォルト動作を抑制（検索バー/アドレスバーへのフォーカス）
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
          e.preventDefault()
        }
      }, { once: true })
      
      dispatch(actionToggleLock)
    }
  }, [ctrlEPressed, metaEPressed, editingTextId, dispatch])
  ```
  - **注意**: キーボードショートカットは[spec/copy_paste_feature.md](./spec/copy_paste_feature.md)のパターンに従う
    - エッジ検知（false → true）で実行
    - 前回の状態更新は早期リターンの前に実行
    - テキスト編集モード中とHTML入力要素にフォーカスがある場合は無効化

  - **参照**: [spec/lock_feature.md](./spec/lock_feature.md) - ロック状態による制御、React Flow Controlsとの連動、キーボードショートカット
  - **参照**: [spec/copy_paste_feature.md](./spec/copy_paste_feature.md) - キーボードショートカットの実装パターン

## テスト更新

- [x] GetInitialViewModelUsecaseのテスト更新
  - **ファイル**: `tests/usecases/GetInitialViewModelUsecase.test.ts`
  - **変更内容**: テスト内で`isLocked: false`が初期値として設定されているか検証
  - **確認事項**: 既存テストが新しいフィールドの追加でエラーになる場合は修正

- [x] exportViewModelのテスト更新
  - **ファイル**: `public/tests/utils/exportViewModel.test.ts`
  - **変更内容**: エクスポート後のViewModelに`isLocked: false`が設定されているか検証
  - **確認事項**: 既存テストが新しいフィールドの追加でエラーになる場合は修正

## ビルドとテスト

- [x] ビルド確認
  - **コマンド**: `npm run generate && npm run build`（または適切なビルドコマンド）
  - **確認事項**: TypeScriptのコンパイルエラーがないこと
  - **結果**: ビルドが成功しました。コンパイルエラーはありません

- [x] テスト実行
  - **コマンド**: `npm run test`
  - **確認事項**: すべてのテストがパスすること
  - **結果**: 268個のテストがすべてパスしました

## 備考

### 仕様書の参照先

- [spec/lock_feature.md](./spec/lock_feature.md) - ロック機能の詳細仕様
- [spec/frontend_state_management.md](./spec/frontend_state_management.md) - フロントエンド状態管理とアクション設計
- [spec/import_export_feature.md](./spec/import_export_feature.md) - インポート・エクスポート時の処理
- [spec/viewmodel_based_api.md](./spec/viewmodel_based_api.md) - APIの初期値
- [spec/copy_paste_feature.md](./spec/copy_paste_feature.md) - キーボードショートカットの実装パターン
- [research/20260213_2236_react_flow_lock_state_control.md](./research/20260213_2236_react_flow_lock_state_control.md) - リサーチレポート

### 実装の注意点

1. **型生成を最初に実行**: `npm run generate`でmain.tspから型を生成してから実装を開始
2. **変化がない場合は同一参照を返す**: Actionで`isLocked`の値が変化しない場合は同一参照を返し、再レンダリングを抑制
3. **キーボードショートカットの状態管理**: エッジ検知で実行し、前回の状態更新は早期リターンの前に実行
4. **pointer-eventsとイベントハンドラーの両方で制御**: `pointer-events: none`で基本的にイベントを無効化し、イベントハンドラーでも早期リターン（保険）
5. **ロック状態の初期値**: 画面を開いた直後は`false`（ロック解除状態）、インポート直後は`true`（ロック状態）
6. **React Flow Controlsとの連動**: `onInteractiveChange`コールバックで`actionToggleLock`をdispatch
