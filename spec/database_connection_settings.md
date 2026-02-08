# データベース接続設定仕様

## 概要

リバースエンジニアリング実行時にデータベース接続情報を設定するモーダルUIの仕様。毎回モーダルを表示し、接続情報を入力してからリバースエンジニアリングを実行する。

## UI仕様

### モーダル表示タイミング

- 「リバースエンジニア」ボタン押下時に**常にモーダルを表示**
- モーダルには前回成功した接続情報が初期値として表示される（パスワードを除く）
- ユーザーが内容を確認・編集してから実行ボタンを押下

### モーダルUI要素

#### 入力フィールド

- **Database Type**: ドロップダウン選択（`mysql` / `postgresql`）
- **Host**: テキスト入力（例: `localhost`）
- **Port**: 数値入力（Database Type選択時に自動調整）
  - MySQL: `3306`
  - PostgreSQL: `5432`
- **User**: テキスト入力（例: `root` / `postgres`）
- **Password**: パスワード入力（マスク表示）
  - UI上の初期値は常に空（セキュリティのため、環境変数があっても表示しない）
  - 空のまま実行した場合、バックエンドで環境変数 `DB_PASSWORD` を使用
- **Database**: テキスト入力（例: `test` / `erviewer`）
- **Schema**: テキスト入力（PostgreSQL選択時のみ表示、デフォルト: `public`）

#### 警告メッセージ

- モーダル内に警告メッセージを表示
- 内容: 「information_schemaを参照するためルートユーザ（または十分な権限を持つユーザ）での実行を推奨します」
- MySQLとPostgreSQLの両方で表示

#### ボタン

- **実行**: リバースエンジニアリングを実行（主ボタン）
- **キャンセル**: モーダルを閉じる

### 初期値の優先順位

#### フロントエンド（モーダル表示時の初期値）

**接続情報（host, port, user, database）**:
1. **ViewModel.settings.lastDatabaseConnection**（前回成功した接続情報）
2. **空（placeholder表示）**

**パスワード**:
- 常に空（セキュリティのため環境変数があっても表示しない）
- 空のまま実行した場合、バックエンドで環境変数 `DB_PASSWORD` を自動的に使用

**placeholder表示**:
- 入力欄が空の場合、placeholderとして一般的な値を表示
- Database Typeに応じて変更
  - MySQL:
    - Host: `localhost`
    - Port: `3306`
    - User: `root`
    - Database: `test`
  - PostgreSQL:
    - Host: `localhost`
    - Port: `5432`
    - User: `postgres`
    - Database: `erviewer`
    - Schema: `public`
  - Password: （placeholderなし）

#### バックエンド（接続情報解決時）

バックエンドでの接続情報解決の詳細は「バックエンドでの接続情報解決」セクションを参照。

### ローディング表示

リバースエンジニアリング実行中：
- モーダルはそのまま表示
- モーダル内にローディングインジケーター（スピナー等）を表示
- 実行ボタンを無効化（二重送信防止）
- キャンセルボタンを無効化（処理中の中断は不可）
- 入力フィールドを無効化（処理中の編集は不可）
- ローディング中であることを示すテキストを表示（例: 「データベースに接続中...」）

実装時の注意：
- `ERDiagramViewModel.loading`フラグを使用してローディング状態を管理
- ローディング中はモーダルの全入力要素とボタンを無効化（`disabled`属性を設定）

### エラー表示

リバースエンジニアリング失敗時：
- モーダルはそのまま表示
- エラーメッセージをモーダル内に表示
- ユーザーが接続情報を修正して再実行可能
- ローディング表示を解除

**エラーメッセージの具体例**:
- 認証エラー: 「認証に失敗しました。ユーザー名またはパスワードを確認してください。」
- 接続エラー: 「データベースサーバーに接続できません。ホストとポート番号を確認してください。」
- データベース不存在: 「指定されたデータベースが見つかりません。データベース名を確認してください。」
- スキーマ不存在（PostgreSQL）: 「指定されたスキーマが見つかりません。スキーマ名を確認してください。」
- 権限不足: 「データベースへのアクセス権限がありません。ユーザーの権限を確認してください。」
- その他のエラー: エラーの詳細を含む具体的なメッセージ

実装時の注意：
- バックエンドは具体的なエラーメッセージを`ErrorResponse`の`error`フィールドに設定する
- データベースドライバーのエラーメッセージをそのまま返すのではなく、ユーザーが理解しやすい形に整形する
- エラーの種類に応じて適切なメッセージを返す（エラーコードやスタックトレースは含めない）
- セキュリティ上の理由から、内部的な実装詳細やシステムパスは含めない

## データモデル仕様

### ViewModel への追加

データモデルは [scheme/main.tsp](/scheme/main.tsp) に定義されています。

追加された型（詳細は [scheme/main.tsp](/scheme/main.tsp) を参照）：
- `DatabaseType`: データベース種別（mysql, postgresql）
- `DatabaseConnectionState`: 接続情報（passwordを除く）
- `AppSettings`: アプリケーション設定
- `ViewModel.settings`: アプリケーション設定フィールド

### パスワードの扱い

- **ViewModel には保存しない**（エクスポート時の漏洩を防ぐ）
- **API呼び出し時にのみ送信**（リクエストボディの別パラメータとして）
- **SessionStorage や LocalStorage にも保存しない**（セキュリティリスク回避）

## API仕様

### リバースエンジニアAPI の変更

API定義とデータ型の詳細は [scheme/main.tsp](/scheme/main.tsp) を参照してください。

- `ReverseEngineerRequest`: リクエストモデル（型定義は main.tsp を参照）
- `DatabaseConnectionState`: 接続情報（パスワード除く、型定義は main.tsp を参照）
- `POST /api/reverse-engineer`: リバースエンジニアリングエンドポイント
  - リクエスト: `ReverseEngineerRequest`
  - レスポンス: `ReverseEngineerResponse | ErrorResponse`

### 接続情報の解決

**初期化時（バックエンド）**:
- `GET /api/init`の実行時に、環境変数（`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`）が存在する場合、`settings.lastDatabaseConnection`に設定
- パスワード（`DB_PASSWORD`）は含めない（セキュリティのため）

**モーダル表示時（フロントエンド）**:
- `settings.lastDatabaseConnection`が存在する場合、その値をモーダルの初期値として表示
- 存在しない場合は空（placeholderが表示される）
- ユーザーが値を編集可能

**リバースエンジニア実行時（フロントエンド）**:
- モーダルで入力された接続情報を`ReverseEngineerRequest`として送信
- すべてのフィールドは必須（フロントエンドで`settings.lastDatabaseConnection`があればそれをデフォルト値として使用）
- パスワード欄が空の場合は空文字列を送信

**バックエンドでの処理**:
- リクエストの接続情報をそのまま使用
- パスワードが空文字列の場合のみ、環境変数`DB_PASSWORD`をフォールバックとして使用
- それ以外のフィールドは環境変数フォールバックを行わない（初期化時に既に設定済みのため）

### レスポンス仕様

成功時：
- `ReverseEngineerResponse` を返却
  - `erData`: データベースから抽出したER図データ
  - `connectionInfo`: 接続に成功した接続情報（passwordを除く）
- フロントエンド側で`connectionInfo`を`settings.lastDatabaseConnection`に保存

失敗時：
- `ErrorResponse` を返却
- エラーメッセージには具体的な失敗理由を含める（認証エラー、接続エラー、DB不存在など）
- フロントエンド側で`lastDatabaseConnection`は更新されない

## UXフロー

### 正常フロー

1. ユーザーが「リバースエンジニア」ボタンを押下
2. **接続設定モーダルが表示される**
   - 前回成功した接続情報が初期値として表示（`lastDatabaseConnection`）
   - 上記がない場合、環境変数から初期化された値が表示（初期化時に設定済み）
   - 値がない項目は空（placeholderが表示される）
   - パスワード欄は常に空（セキュリティのため）
3. ユーザーが必要に応じて接続情報を編集・確認
   - パスワードを入力しなくても、環境変数 `DB_PASSWORD` があればバックエンドで自動使用される
4. ユーザーが「実行」ボタンを押下
5. **ローディング状態開始**
   - モーダル内にローディングインジケーターを表示
   - 入力フィールド、実行ボタン、キャンセルボタンを無効化
   - 「データベースに接続中...」などのメッセージを表示
6. フロントエンドが `ReverseEngineerRequest` を送信
   - `type`: モーダルで選択されたデータベース種別
   - `host`: モーダルで入力されたホスト
   - `port`: モーダルで入力されたポート
   - `user`: モーダルで入力されたユーザー
   - `password`: ユーザーが入力したパスワード（空の場合は空文字列）
   - `database`: モーダルで入力されたデータベース名
7. バックエンドがリバースエンジニアリングを実行
   - パスワードが空文字列の場合のみ環境変数 `DB_PASSWORD` を使用
8. 成功したレスポンス（ERDataと接続情報）を受け取る
9. フロントエンド側でERDataを既存ViewModelとマージ
10. `settings.lastDatabaseConnection`を更新
11. ストアを更新
12. **ローディング状態終了**
13. モーダルを閉じる
14. ER図を表示

### エラーフロー

1. ユーザーが「実行」ボタンを押下
2. **ローディング状態開始**（正常フローと同様）
3. バックエンドでリバースエンジニアリング失敗（認証エラー、接続エラーなど）
4. バックエンドが具体的なエラーメッセージを含む`ErrorResponse`を返す
5. **ローディング状態終了**
6. モーダルは開いたまま
7. エラーメッセージをモーダル内に赤枠で表示
8. ユーザーが接続情報を修正して再実行可能

### キャンセルフロー

1. モーダルの「キャンセル」ボタン押下
2. モーダルを閉じる
3. リバースエンジニアリングは実行されない

## フロントエンド実装概要

### 新規コンポーネント

- `DatabaseConnectionModal.tsx`: 接続設定モーダル
  - 接続情報入力フォーム
  - 実行・キャンセルボタン
  - エラーメッセージ表示エリア
  - ローディングインジケーター（スピナー等）

実装時の注意：
- `loading` プロパティを受け取り、ローディング状態を管理
- ローディング中は入力フィールド、実行ボタン、キャンセルボタンを全て無効化（`disabled`属性）
- ローディング中はローディングインジケーターとメッセージを表示
- エラー表示とローディング表示は排他的（同時に表示しない）

### 状態管理

`GlobalUIState` にモーダル表示フラグを追加。詳細は [scheme/main.tsp](/scheme/main.tsp) を参照してください。

- `showDatabaseConnectionModal`: データベース接続設定モーダルの表示フラグ

### コンポーネント変更

`public/src/components/App.tsx`:
- `DatabaseConnectionModal`に`loading`プロパティを渡す
- `loading`の値は`erDiagram.loading`を使用

### コマンド変更

`public/src/commands/reverseEngineerCommand.ts`:
1. 処理開始時に`actionSetLoading(true)`をdispatch（既存実装）
2. モーダルから接続情報（type, host, port, user, database）とパスワードを取得
3. `ReverseEngineerRequest` 形式でリクエストを送信
   - `type`: モーダルで選択されたデータベース種別
   - `host`: モーダルで入力されたホスト
   - `port`: モーダルで入力されたポート
   - `user`: モーダルで入力されたユーザー
   - `password`: モーダルで入力されたパスワード（空の場合は空文字列）
   - `database`: モーダルで入力されたデータベース名
4. レスポンスで受け取った`erData`を既存ViewModelとマージ（マージロジックの詳細は[増分リバース・エンジニアリング機能仕様](./incremental_reverse_engineering.md)を参照）
5. `settings.lastDatabaseConnection`に`response.connectionInfo`を設定
6. 更新されたViewModelをストアに反映
7. 処理終了時に`actionSetLoading(false)`をdispatch（既存実装、finally節で実行）

## バックエンド実装概要

### Usecase 変更

`lib/usecases/ReverseEngineerUsecase.ts`:
- 引数: `(request: ReverseEngineerRequest)`
- リクエストの接続情報をそのまま使用してデータベースに接続
- パスワードが空文字列の場合のみ、環境変数（`DB_PASSWORD`）をフォールバック
- データベースからERDataを生成
- レスポンスとして`ReverseEngineerResponse`を返却：
  - `erData`: 生成されたER図データ
  - `connectionInfo`: 接続に成功した接続情報（passwordを除く）
- エラー時はユーザーが理解しやすいエラーメッセージをthrowする

### APIエンドポイント実装

`server.ts` の `/api/reverse-engineer` エンドポイント:
- エラーハンドリング時、具体的なエラーメッセージを`ErrorResponse`として返す
- データベースドライバーのエラーを適切に分類し、ユーザー向けのメッセージに変換する

実装時の注意：
- エラーの種類に応じて適切なメッセージを返す（認証エラー、接続エラー、データベース不存在など）
- データベースドライバーのエラーコードやメッセージを使用してエラーを判別する
- エラーメッセージはユーザーが理解しやすい日本語で記述する
- セキュリティ上の理由から、内部実装の詳細やシステムパスは含めない

### DatabaseManager 変更

`lib/database.ts`:
- `connect()` メソッドは既に外部設定を受け取れる実装になっている
- 特に変更不要

## 将来の拡張性

### 複数データベース対応

詳細は [spec/multi_database_support.md](/spec/multi_database_support.md) を参照。

- Database Typeドロップダウンでデータベースを選択
- Type選択時にポート番号とplaceholderが自動調整
- PostgreSQL選択時はSchema入力欄が表示される

### 接続テスト機能（オプション）

MVPでは省略。将来追加する場合：
- モーダルに「接続テスト」ボタンを追加
- `POST /api/test-connection` エンドポイントを作成
- 接続のみテストして即座に切断、結果をモーダルに表示

## 関連仕様書

- [リバースエンジニアリング機能仕様](./reverse_engineering.md) - リバースエンジニアリング全体の仕様
- [ViewModelベースAPI仕様](./viewmodel_based_api.md) - API全体の設計方針
- [フロントエンド状態管理仕様](./frontend_state_management.md) - 状態管理の詳細
- [インポート・エクスポート機能仕様](./import_export_feature.md) - ViewModel保存時の考慮事項
- [scheme/main.tsp](/scheme/main.tsp) - 型定義
