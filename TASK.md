# タスク一覧

## 概要

仕様書 [spec/frontend_er_rendering.md](spec/frontend_er_rendering.md) の「パンスクロール操作」に関する変更に対応する実装タスク。

パンスクロール操作に「ホイールボタンドラッグ」を追加し、パンモード中に矩形・テキストのドラッグを無効化する機能を実装する。

## 現状分析

### 既に実装済みの機能
- スペースキー押下によるパンモード（`useKeyPress('Space')`）
- テキスト編集中のスペースキー無効化（`effectiveSpacePressed`）
- スペースキー押下時のホバー状態クリア
- スペースキー押下時のエンティティドラッグ無効化（`nodesDraggable={!effectiveSpacePressed}`）
- スペースキー押下時のカーソル変更（`grab`/`grabbing`）
- `panOnDrag={true}`の設定（ホイールボタンドラッグは既に有効）

### 未実装の機能
- パンモード中（スペースキー押下中またはホイールボタンドラッグ中）の矩形・テキストのドラッグ無効化

## 実装タスク

### 矩形のドラッグ無効化処理を追加

**対象ファイル**: `public/src/components/ERCanvas.tsx`

**変更箇所**: `handleRectangleMouseDown`関数

**変更内容**:
- 関数の冒頭に以下の早期リターン処理を追加：
  1. `effectiveSpacePressed === true`の場合、`return`（ドラッグを開始しない）
  2. `e.button === 1`（ホイールボタン）の場合、`return`（ドラッグを開始しない）
- 早期リターンは`e.stopPropagation()`の後に配置する

**実装の意図**:
- スペースキー押下中は矩形のドラッグを無効化し、パンスクロールのみを実行する
- ホイールボタンでのドラッグ時も矩形のドラッグを無効化し、React Flowのデフォルトのパン機能に処理を委譲する

**参照仕様**: [spec/frontend_er_rendering.md](spec/frontend_er_rendering.md) の「矩形・テキストのドラッグ無効化」セクション（375-382行目）

---

### テキストのドラッグ無効化処理を追加

**対象ファイル**: `public/src/components/ERCanvas.tsx`

**変更箇所**: `handleTextMouseDown`関数

**変更内容**:
- 関数の冒頭に以下の早期リターン処理を追加：
  1. `effectiveSpacePressed === true`の場合、`return`（ドラッグを開始しない）
  2. `e.button === 1`（ホイールボタン）の場合、`return`（ドラッグを開始しない）
- 早期リターンは`e.stopPropagation()`の後に配置する

**実装の意図**:
- スペースキー押下中はテキストのドラッグを無効化し、パンスクロールのみを実行する
- ホイールボタンでのドラッグ時もテキストのドラッグを無効化し、React Flowのデフォルトのパン機能に処理を委譲する

**参照仕様**: [spec/frontend_er_rendering.md](spec/frontend_er_rendering.md) の「矩形・テキストのドラッグ無効化」セクション（375-382行目）

---

### ビルドの確認

**実行コマンド**: `npm run generate && npm run build`

**確認内容**:
- 型生成が正常に完了すること
- ビルドエラーが発生しないこと

---

### テストの実行

**実行コマンド**: `npm run test`

**確認内容**:
- 既存のテストが全て成功すること
- 新たなテストエラーが発生していないこと

**補足**:
- 今回の変更は操作系の処理追加であり、既存のロジックを変更するものではないため、新規テストコードの作成は不要
- ただし、既存テストが正常に動作することを確認する

---

## 事前修正提案

なし

## 備考

### ホイールボタンドラッグについて
- React Flowは`panOnDrag={true}`設定により、デフォルトでホイールボタンドラッグによるパンをサポートしている
- 既に`panOnDrag={true}`は設定済みのため、ホイールボタンドラッグ自体の実装は不要
- 矩形・テキストの`onMouseDown`でホイールボタン（`e.button === 1`）を除外することで、React Flowのデフォルト動作に処理を委譲する

### パンモードの判定
- スペースキー押下中: `effectiveSpacePressed`変数で判定（既存の実装）
- ホイールボタンドラッグ中: `e.button === 1`で判定（今回追加）

### 修正対象ファイル数
- 修正: 1ファイル（`public/src/components/ERCanvas.tsx`）
- フェーズ分けは不要
