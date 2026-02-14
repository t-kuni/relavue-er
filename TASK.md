# ロック機能仕様更新に伴う実装タスク

**参照仕様書**: [spec/lock_feature.md](./spec/lock_feature.md)

## 背景

直前のコミットで`spec/lock_feature.md`が更新され、ロック機能の仕様が明確化されました。

### 主な仕様変更

1. **ロック機能の目的を明確化**
   - 編集操作の禁止であり、閲覧操作（エンティティの選択、ホバーによるハイライト表示）は有効のまま維持
   - ロック状態でもエンティティを選択してDDLパネルでDDLを閲覧したり、エンティティ・リレーション・カラムにホバーしてハイライト表示を確認したりできる

2. **`elementsSelectable`の変更**
   - 変更前: `elementsSelectable={!isLocked}`（ロック時は選択を無効化）
   - 変更後: `elementsSelectable={true}`（ロック状態に関わらず選択を有効化）
   - 理由: エンティティの選択は閲覧操作であり、ロック時も有効にする

3. **矩形・テキストとエンティティ・リレーションの区別**
   - **エンティティ・リレーション**: 選択・ホバーは有効（閲覧操作として許可）
   - **矩形・テキスト**: ロック時はすべての操作を無効化（`pointer-events: none`で実装済み）
   - 理由: 矩形・テキストは純粋な注釈要素であり、閲覧目的でのインタラクションが不要

4. **イベントハンドラーの変更**
   - 矩形・テキストの`onClick`の早期リターンを削除（仕様書から削除された）
   - 理由: `pointer-events: none`でクリックイベント自体が発火しないため、不要

## タスク一覧

### - [ ] ERCanvas.tsxの`elementsSelectable`プロパティを変更

**対象ファイル**: `public/src/components/ERCanvas.tsx`

**変更内容**:

1055行目付近の`elementsSelectable`プロパティを変更:

```tsx
// 変更前
elementsSelectable={!isLocked}

// 変更後
elementsSelectable={true}
```

**理由**:
- ロック機能の目的は編集操作の禁止であり、閲覧操作（エンティティの選択、ホバー）は有効のまま維持する
- エンティティを選択してDDLパネルでDDLを閲覧できるようにする
- 矩形・テキストは`pointer-events: none`で無効化されているため、選択は無効（クリックイベントが発火しない）

**参照**: [spec/lock_feature.md](./spec/lock_feature.md) - ロック状態による制御 > React Flowのノード・エッジ

---

### - [ ] コード生成の実行

**コマンド**: `npm run generate`

**目的**: main.tspから型定義を生成

**参照**: [.cursor/rules/global.mdc](.cursor/rules/global.mdc) - 利用可能なコマンド

---

### - [ ] 型チェックの実行

**コマンド**: `npm run typecheck`

**目的**: TypeScriptの型エラーがないことを確認

**確認項目**:
- バックエンドの型チェック: `tsc -p tsconfig.server.json --noEmit`
- フロントエンドの型チェック: `tsc -p public/tsconfig.json --noEmit`

---

### - [ ] テストの実行

**コマンド**: `npm run test`

**目的**: 既存のテストが通ることを確認

**確認項目**:
- すべてのテストがパスすること
- テストカバレッジが低下していないこと

**参照**: [.cursor/rules/global.mdc](.cursor/rules/global.mdc) - 利用可能なコマンド

---

### - [ ] （オプション）actionToggleLockのユニットテストを追加

**対象ファイル**: `public/tests/actions/globalUIActions.test.ts`

**追加内容**:

`actionToggleLock`のテストケースを追加:
- ロック状態が`false`から`true`に切り替わること
- ロック状態が`true`から`false`に切り替わること
- 既存の不変性が保たれること（元のViewModelが変更されないこと）

**参照**: 
- [public/tests/actions/globalUIActions.test.ts](./public/tests/actions/globalUIActions.test.ts) - 既存のテストコード（`actionToggleHistoryPanel`を参考にする）
- [public/src/actions/globalUIActions.ts](./public/src/actions/globalUIActions.ts) - 実装コード

**備考**: このタスクはオプション。時間に余裕があれば実装する。

---

## 実装済みの確認事項

以下の実装は既に仕様通りに実装されていることを確認済み:

✓ 矩形・テキストの`pointer-events`制御（`isLocked ? 'none' : 'auto'`）
  - `public/src/components/ERCanvas.tsx`: 724行目（矩形）、802行目（テキスト）

✓ 矩形・テキストのイベントハンドラーの早期リターン
  - `handleRectangleMouseDown`: 423行目に`if (isLocked) return`
  - `handleTextMouseDown`: 663行目に`if (isLocked) return`
  - テキストの`onDoubleClick`: 815行目に`if (isLocked) return`

✓ テキスト編集UIの表示制御
  - 1071行目: `{(!isLocked && editingTextId && texts[editingTextId]) && (...)`

✓ ロックトグルアクションの実装
  - `public/src/actions/globalUIActions.ts`: `actionToggleLock`

✓ キーボードショートカット（Ctrl+E / Cmd+E）の実装
  - `public/src/components/ERCanvas.tsx`: 593-620行目

## 関連仕様書

- [spec/lock_feature.md](./spec/lock_feature.md) - ロック機能の詳細仕様
- [spec/entity_selection_and_ddl_panel.md](./spec/entity_selection_and_ddl_panel.md) - エンティティ選択とDDLパネルの仕様
- [spec/frontend_state_management.md](./spec/frontend_state_management.md) - フロントエンド状態管理の仕様

## 備考

- 矩形・テキストは`pointer-events: none`で制御されているため、ロック時にはクリックイベント自体が発火しない
- エンティティ・リレーションは`elementsSelectable={true}`のため、ロック時も選択・ホバーが可能
- この仕様変更により、ロック状態でもエンティティのDDLを閲覧できるようになり、ユーザビリティが向上する
