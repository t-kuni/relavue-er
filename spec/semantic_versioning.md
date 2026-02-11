# セマンティックバージョニング仕様

## バージョニング方式

Semantic Versioning 2.0.0に準拠した`MAJOR.MINOR.PATCH`形式を採用する。

- **MAJOR**: 互換性を壊す変更
- **MINOR**: 後方互換な機能追加
- **PATCH**: 後方互換なバグ修正

## 互換性（Public API）の範囲

このプロジェクトで「互換性」とみなす範囲：

### Docker実行時のI/F
- 環境変数
- 起動方法
- 公開ポート（30033）
- 永続化（ボリュームマウントポイントと意味）
- 入出力（ER図JSONの形式）
- 外部DB接続方法

### ブラウザ機能で外部に影響する仕様
- インポート/エクスポートのJSON形式
- DDL表示/保持の形式
- URL/設定の互換性

## バージョン番号の管理方法

### ツール
npm CLI（v11系）の`npm version`コマンドを使用する。

### 実行方法
GitHub Actionsの`workflow_dispatch`により手動トリガーで実行する。

入力パラメータ：
- `bump`: `major`, `minor`, `patch`のいずれかを選択

### 動作
1. `npm version <bump>`を実行
2. package.jsonのバージョンを更新
3. コミットを自動作成
4. Gitタグ（`vX.Y.Z`形式）を自動作成
5. タグをリモートリポジトリにpush

## Gitタグ

### 形式
- `vX.Y.Z`形式（例：`v1.2.3`）
- npmのデフォルト設定（`tag-version-prefix: "v"`）を使用

### 付与タイミング
GitHub Actionsの`workflow_dispatch`実行時に自動付与される。

## Dockerイメージのタグ戦略

### タグの種類
Gitタグ`vX.Y.Z`がpushされた際に、以下の3種類のDockerタグを自動生成する：

1. **`X.Y.Z`**: 完全バージョン（不変）
   - 例：`1.2.3`
   - 特定バージョンの固定に使用

2. **`X`**: MAJORバージョン（可変）
   - 例：`1`
   - 同一MAJOR内の最新版を追従

3. **`latest`**: 最新安定版（可変）
   - 常に最新の安定版を指す

### タグ生成方法
`docker/metadata-action`の`type=semver`を使用して自動生成する。

### プラットフォーム
- `linux/amd64`
- `linux/arm64`

## DockerHubへのプッシュ

### 実行方法
GitHub Actionsで自動化する。

### トリガー
Gitタグ（`v*`形式）のpush時に実行される。

### 認証
Docker Hub Personal Access Tokenを使用する。
GitHub Secretsに以下を設定：
- `DOCKERHUB_USERNAME`: Docker Hubユーザー名
- `DOCKERHUB_TOKEN`: Docker Hub Personal Access Token

### ビルドキャッシュ
GitHub Actions Cache（`type=gha`）を使用する。

## CHANGELOG

当初はGitHub Releasesの自動生成リリースノートで代替する。

### 生成タイミング
Gitタグpush時に、GitHub Releasesを自動作成する際にリリースノートを自動生成する。

### 生成方法
`gh release create`コマンドの`--generate-notes`オプションを使用する。

## ロールバック戦略

### Dockerイメージの切り戻し
- **推奨**: 本番環境では不変タグ（`X.Y.Z`形式）を使用
- `latest`や`X`のような可変タグは検証・開発用途に限定
- 緊急時は、以前の不変タグに切り替える

### Gitタグの扱い
- 公開済みタグの削除・付け替えは行わない
- 誤リリースの場合は、修正版（PATCH）を新しく出す

### トレーサビリティ
DockerイメージにOCIラベル`org.opencontainers.image.revision`を付与し、Git SHAを記録する。

## プレリリース版

当初は対応しない。
将来的に必要になった場合は、SemVerプレリリース形式（例：`1.2.3-beta.1`）を採用する。

## package.json、Gitタグ、Dockerタグの同期

### 同期方針
Gitタグを起点として、以下の流れで同期を保つ：

1. `npm version`がpackage.jsonを更新
2. `npm version`がGitタグ（`vX.Y.Z`）を作成
3. Gitタグpush時に、Dockerタグ（`X.Y.Z`, `X`, `latest`）を自動生成

### 破綻防止
GitHub ActionsでDockerビルド前に、以下を検証する：
- Gitタグ（`v`除去）とpackage.jsonのversionが一致しているか
