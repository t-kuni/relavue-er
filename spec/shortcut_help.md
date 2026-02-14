# ショートカットキーヘルプ仕様

## 概要

本仕様書は、ER Diagram Viewerにおけるショートカットキーヘルプの表示機能を定義する。
ユーザーが利用可能なショートカットキーとマウス操作を画面上で確認できるようにする。

関連仕様：
- フロントエンドの状態管理については[frontend_state_management.md](./frontend_state_management.md)を参照
- テキスト描画機能については[text_drawing_feature.md](./text_drawing_feature.md)を参照
- 矩形描画機能については[rectangle_drawing_feature.md](./rectangle_drawing_feature.md)を参照

## 基本方針

* ユーザーが操作方法を素早く確認できるようにする
* 画面占有面積を最小限にし、必要に応じて展開/折りたたみできるようにする
* 多言語対応（国際化対応）する

## 配置

* 画面左上に配置
* 「矩形追加」「テキスト追加」ボタンの下に配置
* z-index: 10（ツールバーボタンと同じレイヤー）

## 表示状態

### 展開状態（デフォルト）

* 初回表示時は展開状態で表示
* ショートカットキー一覧を縦に並べて表示
* 背景色: 半透明の白（`rgba(255, 255, 255, 0.95)`）
* 枠線: 1px solid #ddd
* 角丸: 4px
* パディング: 0.75rem
* フォントサイズ: 14px
* 行間: 1.6
* 最小幅: 250px

### 折りたたみ状態

* ユーザーがヘルプを閉じた後の表示
* 丸いボタン（円形）で表示
* サイズ: 36px × 36px
* 背景色: 半透明の白（`rgba(255, 255, 255, 0.95)`）
* 枠線: 1px solid #ddd
* アイコン: `?`（疑問符、テキスト）
* フォントサイズ: 20px
* フォントウェイト: bold
* テキスト色: #333
* ホバー時: 背景色を`rgba(255, 255, 255, 1)`に変更
* カーソル: pointer

## ヘルプ内容

以下のショートカットキーとマウス操作を表示する：

### 常時有効な操作

* **マウスホイール**: ズーム
* **Space + ドラッグ**: パン（キャンバス移動）
* **Ctrl + S** (Mac: Cmd + S): 保存（エクスポート）
* **Ctrl + E** (Mac: Cmd + E): 編集モード切り替え

### 編集モード中のみ有効な操作

* **Shift + ドラッグ**: 矩形選択

## 表示形式

### 展開時の表示レイアウト

ヘルプパネルは以下の構造で表示される：

* **ヘッダー部分**: 
  - 左側に「ショートカットキー」というタイトル（太字）
  - 右側に閉じるボタン（×）
  - ヘッダーとコンテンツの間に区切り線（border-bottom）を配置
* **常時有効な操作**: 
  - 「マウスホイール: ズーム」
  - 「Space + ドラッグ: パン」
  - 「Ctrl + S: 保存（エクスポート）」（Mac環境では「Cmd + S」）
  - 「Ctrl + E: 編集モード切り替え」（Mac環境では「Cmd + E」）
* **編集モード中のみ有効な操作**:
  - 見出し「編集モード中」（太字、上部に余白）の下に配置
  - 「Shift + ドラッグ: 矩形選択」をインデント付きで表示（左に16pxの余白）

各項目は縦に並べて表示され、項目間には適切な行間（1.6）を確保する。

### 折りたたみ時の表示

円形のボタンとして表示され、中央に「?」（疑問符）のテキストを配置する。クリックすると展開状態に切り替わる。

## 状態管理

### ViewModel統合

`GlobalUIState`に以下のフィールドを追加：

```typescript
model GlobalUIState {
  // 既存のフィールド...
  showShortcutHelp: boolean; // ショートカットヘルプの展開/折りたたみ状態（true: 展開, false: 折りたたみ）
}
```

### デフォルト値

* `showShortcutHelp`: `true`（初回表示時は展開状態）
* フロントエンド（`getInitialGlobalUIState()`）とバックエンド（`GetInitialViewModelUsecase`）の両方で `true` を設定する

### 状態の永続化

* ユーザーがヘルプを閉じた/開いた状態は、エクスポートしたJSONファイルに保存される
* **インポート時は常に `true`（展開状態）にリセットされる**
  - ファイルをインポートした後、ユーザーが最初にショートカットキーを確認できるようにするため

## Action設計

ショートカットヘルプ操作用のActionを`public/src/actions/globalUIActions.ts`に追加：

* `actionToggleShortcutHelp(vm)`: ショートカットヘルプの展開/折りたたみ状態をトグル

## UI実装方針

### コンポーネント配置

* `ERCanvas.tsx`内に直接実装（新しいコンポーネントファイルを作らない）
* ツールバーボタンの下に配置（`position: absolute; top: 80px; left: 10px;`）

### 展開/折りたたみの切り替え

* 展開状態の閉じるボタン（×）をクリック → `actionToggleShortcutHelp`をdispatch → 折りたたみ状態に変更
* 折りたたみ状態のボタン（?）をクリック → `actionToggleShortcutHelp`をdispatch → 展開状態に変更

### プラットフォーム検出

* `navigator.platform`または`navigator.userAgent`を使用してMac環境を検出
* Mac環境では「Ctrl」を「Cmd」に置き換えて表示
* または`e.metaKey`の存在をチェックして動的に判定

### ロック状態との連動

* ロック状態（`GlobalUIState.isLocked`）に応じて「編集モード中」セクションの表示を切り替え
* ロック中（編集不可）: 「編集モード中」セクションを非表示
* 編集可能: 「編集モード中」セクションを表示

## 国際化対応

翻訳キーは`public/locales/{lang}/translation.json`の`shortcut_help`セクションに定義されている：

* [日本語（ja）](../public/locales/ja/translation.json)
* [英語（en）](../public/locales/en/translation.json)
* [中国語（zh）](../public/locales/zh/translation.json)

`{{key}}`プレースホルダーにプラットフォームに応じて「Ctrl」または「Cmd」を動的に挿入する。

## 実装時の注意事項

* ヘルプの表示/非表示切り替えはアニメーションなしで即座に行う（シンプルな実装）
* ヘルプのUIは他の要素（エンティティ、矩形、テキスト）と重ならないように配置
* ヘルプのクリックイベントは伝播しないようにする（`e.stopPropagation()`）
* プラットフォーム判定は`navigator.platform`を使用し、`Mac`を含む場合は「Cmd」、それ以外は「Ctrl」と表示
* ロック状態の変更を`useViewModel`で購読し、リアルタイムに「編集モード中」セクションの表示を切り替え
* TypeSpecの`GlobalUIState`に`showShortcutHelp`を追加し、`npm run generate`で型を再生成する
* フロントエンドとバックエンドの両方で初期値を設定する：
  - `public/src/utils/getInitialViewModelValues.ts`の`getInitialGlobalUIState()`に`showShortcutHelp: true`を追加（アプリケーション起動時とファイルインポート時に使用される）
  - `lib/usecases/GetInitialViewModelUsecase.ts`の`GlobalUIState`初期化に`showShortcutHelp: true`を追加（バックエンドからの初期ViewModel取得時に使用される）

## 段階的実装アプローチ

1. TypeSpecの`GlobalUIState`に`showShortcutHelp: boolean`を追加し、型を再生成
2. `getInitialViewModelValues.ts`の`getInitialGlobalUIState()`に`showShortcutHelp: true`を追加（アプリケーション起動時とインポート時に使用される）
3. `globalUIActions.ts`に`actionToggleShortcutHelp`を追加
4. 翻訳ファイル（ja/en/zh）に`shortcut_help`キーを追加
5. `ERCanvas.tsx`内にショートカットヘルプUIを実装
   - 展開状態のレイアウト（ヘッダー、ショートカット一覧、閉じるボタン）
   - 折りたたみ状態のレイアウト（丸い?ボタン）
   - プラットフォーム判定ロジック（Ctrl vs Cmd）
   - ロック状態に応じた「編集モード中」セクションの表示切り替え
6. クリックイベントハンドラを実装（`actionToggleShortcutHelp`をdispatch）

## 懸念事項・確認事項

### 技術的懸念

* ヘルプのUIが他の要素（レイヤーパネル等）と重なる可能性（z-indexで対応）
* プラットフォーム判定の正確性（一部のブラウザでは`navigator.platform`が非推奨）
* 翻訳キーの命名規則が他の翻訳キーと一貫しているか

### 今後の検討事項

* ヘルプ内容のさらなる充実（コピー&ペースト、Undo/Redo等）
* ヘルプのアニメーション（フェードイン/アウト）
* ヘルプの位置をユーザーがカスタマイズできる機能
* ヘルプのフォントサイズをユーザーがカスタマイズできる機能
