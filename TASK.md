# タスク一覧

## 概要

`spec/shortcut_help.md` の仕様に基づき、ショートカットキーヘルプの表示機能を実装します。

## 実装タスク

### TypeSpec定義の更新

- [ ] `scheme/main.tsp` の `GlobalUIState` モデルに `showShortcutHelp: boolean` フィールドを追加
  - コメント: `// ショートカットヘルプの展開/折りたたみ状態（true: 展開, false: 折りたたみ）`
  - デフォルト値は `true` で初期化（アプリケーション起動時、インポート時は展開状態）

### 型の再生成

- [ ] TypeSpecの型定義を再生成
  - コマンド: `npm run generate`
  - 生成される型:
    - `lib/generated/api-types.ts` (バックエンド用)
    - `public/src/api/client/models/` (フロントエンド用)

### 初期値設定の更新

- [ ] `public/src/utils/getInitialViewModelValues.ts` の `getInitialGlobalUIState()` 関数に `showShortcutHelp: true` を追加
  - この関数はアプリケーション起動時とファイルインポート時に呼ばれる
  - インポート時に常に `true` になることで、ユーザーがショートカットキーを確認しやすくする

### Action実装

- [ ] `public/src/actions/globalUIActions.ts` に `actionToggleShortcutHelp` を追加
  - 関数シグネチャ: `actionToggleShortcutHelp(viewModel: ViewModel): ViewModel`
  - 実装内容:
    - `viewModel.ui.showShortcutHelp` の真偽値を反転
    - 変化がない場合は同一参照を返す（再レンダリング抑制のため）
  - 既存のactionと同じパターンで実装（`actionShowBuildInfoModal` などを参考）

### テストコード作成

- [ ] `public/tests/actions/globalUIActions.test.ts` にテストを追加
  - テスト対象: `actionToggleShortcutHelp`
  - テストケース:
    - `showShortcutHelp` が `false` から `true` に切り替わること
    - `showShortcutHelp` が `true` から `false` に切り替わること
    - 既存テストパターンを参考にする

### UI実装

- [ ] `public/src/components/ERCanvas.tsx` にショートカットヘルプUIを実装
  - 参照仕様: `spec/shortcut_help.md`
  - 実装箇所: `ERCanvas.tsx` 内に直接実装（新しいコンポーネントファイルは作らない）
  - 実装内容:
    - **配置**: 画面左上、「矩形追加」「テキスト追加」ボタンの下（`position: absolute; top: 80px; left: 10px; z-index: 10`）
    - **展開状態のUI**:
      - 半透明の白背景（`rgba(255, 255, 255, 0.95)`）、枠線（`1px solid #ddd`）、角丸（`4px`）、パディング（`0.75rem`）
      - ヘッダー: 左側に「ショートカットキー」タイトル（太字、`t('shortcut_help.title')`）、右側に閉じるボタン（`×`、`t('shortcut_help.close')`）、区切り線
      - 常時有効な操作セクション:
        - `t('shortcut_help.mouse_wheel_zoom')`
        - `t('shortcut_help.space_drag_pan')`
        - `t('shortcut_help.save', { key: isMac ? 'Cmd' : 'Ctrl' })`
        - `t('shortcut_help.toggle_edit_mode', { key: isMac ? 'Cmd' : 'Ctrl' })`
      - 編集モード中セクション（`!isLocked` の場合のみ表示）:
        - 見出し: `t('shortcut_help.edit_mode_section')`（太字、上部余白）
        - `t('shortcut_help.shift_drag_select')`（左に16pxの余白）
    - **折りたたみ状態のUI**:
      - 円形ボタン（36px × 36px）、半透明の白背景（`rgba(255, 255, 255, 0.95)`）、枠線（`1px solid #ddd`）
      - 中央に「?」（20px、太字、色: `#333`）
      - ホバー時: 背景色を `rgba(255, 255, 255, 1)` に変更、カーソル: `pointer`
    - **プラットフォーム判定**:
      - `navigator.platform` を使用して判定（`platform.includes('Mac')` → `isMac`）
      - Mac環境では「Ctrl」を「Cmd」に置き換え
    - **イベントハンドラ**:
      - 閉じるボタン/円形ボタンのクリック: `dispatch(actionToggleShortcutHelp, viewModel)` → クリックイベントの伝播を防ぐ（`e.stopPropagation()`）
    - **状態購読**:
      - `const showShortcutHelp = useViewModel(vm => vm.ui.showShortcutHelp)`
      - `const isLocked = useViewModel(vm => vm.erDiagram.ui.isLocked)`
    - **国際化**:
      - `useTranslation()` フックで翻訳キーを使用（`t('shortcut_help.*')`）
      - 翻訳ファイルは既に更新済み（`public/locales/{ja,en,zh}/translation.json`）

### ビルドの確認

- [ ] ビルドが正常に完了することを確認
  - TypeScriptのコンパイルエラーがないこと
  - 必要に応じて型エラーを修正

### テストの実行

- [ ] すべてのテストが成功することを確認
  - コマンド: `npm run test`
  - 新規追加したテストを含め、すべてのテストがパスすること
  - テスト失敗がある場合は修正

## 注意事項

- 仕様書（`spec/shortcut_help.md`）に定義された内容を正確に実装すること
- 翻訳ファイル（`public/locales/{ja,en,zh}/translation.json`）の `shortcut_help` セクションは既に追加済み
- プラットフォーム判定は `navigator.platform` を使用（一部ブラウザで非推奨だが、現時点では問題ない）
- ヘルプのクリックイベントは伝播しないようにする（`e.stopPropagation()`）
- ロック状態に応じて「編集モード中」セクションの表示を動的に切り替える
- **インポート時の挙動**: ファイルをインポートした際、`showShortcutHelp` は常に `true`（展開状態）にリセットされる。これにより、ユーザーが最初にショートカットキーを確認できるようにする
