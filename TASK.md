# タスク一覧

## 概要

仕様追加：履歴パネルの差分表示内テーブル名クリック機能の実装。

仕様書: `spec/reverse_engineering_history.md` の「差分表示内のテーブル名クリック」節

---

## タスク

### 1. HistoryPanel.tsx にテーブル名クリック機能を実装する

**対象ファイル**: `public/src/components/HistoryPanel.tsx`

**実装内容**:

- `useReactFlow`, `useViewport`, `useDispatch`, `useViewModel` を import する
- ER図に現在存在するノード一覧（`vm.erDiagram.nodes`）を取得する
- テーブル名クリック時に以下を実行するハンドラを実装する（TableListPanel と同じ挙動）
  - `actionSelectItem` でエンティティを選択状態にする
  - `setCenter()` で対象エンティティが画面中央に来るようにパンする（アニメーションあり）
- クリック対象の箇所（5箇所）にクリック可否を判定してスタイルと onClick を適用する
  - 追加されたテーブル名のリスト
  - 削除されたテーブル名のリスト（テーブル名部分）
  - 追加されたカラムの `tableName` 部分
  - 削除されたカラムの `tableName` 部分
  - 変更されたカラムの `tableName` 部分
- clickable 判定: クリック時点で `nodes` に存在するテーブル名のみ clickable とする
- スタイル区別:
  - clickable: `cursor: pointer`, 下線, 色付き（例: `#1976d2`）
  - non-clickable: `cursor: default`, 装飾なし, グレー系

### 2. ビルド確認

```bash
npm run generate
npm run test
```
