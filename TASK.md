# タスク一覧

仕様書の更新（直前のコミット）に基づく実装タスク。

対象仕様書：
- [table_list_panel.md](./spec/table_list_panel.md)
- [shortcut_help.md](./spec/shortcut_help.md)
- [layer_management.md](./spec/layer_management.md)

---

## フェーズ 1: Ctrl+F ショートカット実装 ✅完了

### ショートカット実装

- [x] **`public/src/components/App.tsx`** に Ctrl+F（Cmd+F）キーボードショートカットを追加する
  - 仕様：[table_list_panel.md § キーボードショートカット](./spec/table_list_panel.md)
  - 実装方針：既存の Ctrl+S ショートカット（`handleKeyDown` の `useEffect`）と同じパターンで追加
  - 挙動の詳細：
    - パネルが閉じている場合：`actionToggleTableListPanel` をdispatchしてパネルを開き、入力欄にフォーカスする。`event.preventDefault()` でブラウザのデフォルト検索を抑止する
    - パネルが開いていて入力欄にフォーカスが当たっていない場合：入力欄にフォーカスする。`event.preventDefault()` でブラウザのデフォルト検索を抑止する
    - パネルが開いていて入力欄にフォーカスが当たっている場合：何もせず、ブラウザのデフォルト動作（ブラウザ検索）を許可する（`event.preventDefault()` を呼ばない）
  - 入力欄へのフォーカスには `useRef` と `ref.current.focus()` を使用する
  - `App.tsx` から `TableListPanel` の入力欄 ref を受け渡す必要があるため、`TableListPanel` コンポーネントに `inputRef` プロパティ（`React.RefObject<HTMLInputElement>`）を追加する

- [x] **`public/src/components/TableListPanel.tsx`** に `inputRef` プロパティを追加する
  - `inputRef?: React.RefObject<HTMLInputElement>` を props に追加
  - `<input>` 要素に `ref={inputRef}` を付与する

- [x] **`public/src/components/ERCanvas.tsx`** のショートカットヘルプに Ctrl+F の表示を追加する（翻訳キー `shortcut_help.open_table_list` を使用。翻訳ファイルは既に追加済み）
  - 確認の結果、まだ追加されていなかったため、1304行目に追加済み

### ビルド確認・テスト実行

- [x] `npm run generate`（型に変更がないため省略）
- [x] `npm run test` でテストが通ることを確認する
  - 278テスト全て成功
- [x] `npm run build`（または開発サーバーで動作確認できるビルドコマンド）でビルドが通ることを確認する
  - ビルド成功（警告はあるがエラーなし）
  - 開発サーバーでの動作確認は未実施

---

## フェーズ 2: サイドバーのドラッグリサイズ実装 ✅完了

### サイドバーリサイズ実装

- [x] **`public/src/components/App.tsx`** の左サイドバー（`showLayerPanel` / `showTableListPanel` の div）をドラッグリサイズに対応させる
  - 仕様：[table_list_panel.md § サイドバー幅の変更](./spec/table_list_panel.md)
  - 幅は `useState` でローカル管理する（ViewModelには持たない）。初期値は 250px 程度
  - 最小幅 150px、最大幅 600px を設ける
  - レイヤーパネルとテーブル一覧パネルは同じ左サイドバーを共有するため、同一の幅変数を使用する
  - サイドバー div の `width: '250px'` を動的な状態変数に置き換える
  - サイドバーの右縁にリサイズハンドル要素を配置する（縦線など視覚的に分かる要素）
    - `position: absolute; right: 0; top: 0; bottom: 0; width: 6px; cursor: col-resize;` 相当のスタイル
    - `onMouseDown` でドラッグ開始、`window.addEventListener('mousemove')` でリサイズ、`window.addEventListener('mouseup')` でドラッグ終了
    - ドラッグ中は `event.preventDefault()` でテキスト選択を防ぐ
    - コンポーネントのアンマウント時に `removeEventListener` でクリーンアップする

### テーブル名の省略表示

- [x] **`public/src/components/TableListPanel.tsx`** のテーブル名リスト項目に省略表示スタイルを追加する
  - 仕様：[table_list_panel.md § テーブル一覧の表示](./spec/table_list_panel.md)
  - 各テーブル名 div に以下のスタイルを追加する：
    ```
    overflow: 'hidden'
    textOverflow: 'ellipsis'
    whiteSpace: 'nowrap'
    ```

### ビルド確認・テスト実行

- [x] `npm run test` でテストが通ることを確認する
  - 278テスト全て成功
- [x] `npm run build`（または開発サーバーで動作確認できるビルドコマンド）でビルドが通ることを確認する
  - ビルド成功（警告はあるがエラーなし）
  - 開発サーバーでの動作確認は未実施
