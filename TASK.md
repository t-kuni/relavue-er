# セマンティックバージョニング実装タスク

## 参照仕様書
- [spec/semantic_versioning.md](./spec/semantic_versioning.md)
- [research/20260211_1153_semantic_versioning_strategy.md](./research/20260211_1153_semantic_versioning_strategy.md)
- [README_DEVELOP.md](./README_DEVELOP.md)（バージョンリリース運用のセクション）

## フェーズ1: GitHub Actionsワークフローの作成 ✅

### ディレクトリ構造の作成

- [x] `.github/workflows/`ディレクトリを作成
  - 現在`.github`ディレクトリ自体が存在しないため、まず作成する

### Version Bump and Tagワークフロー作成

- [x] `.github/workflows/version-bump.yml`を作成
  - **目的**: workflow_dispatchで手動トリガーし、バージョン更新・Gitタグ作成・pushを自動化
  - **トリガー**: `workflow_dispatch`
  - **入力パラメータ**: 
    - `bump`: choice型、選択肢は`major`, `minor`, `patch`
  - **ジョブ内容**:
    1. リポジトリをチェックアウト
    2. Node.js環境をセットアップ（v20）
    3. gitの設定（user.name, user.emailをGitHub Actions botに設定）
    4. `npm version ${{ inputs.bump }}`を実行
       - これにより`package.json`のバージョンが更新され、コミットとGitタグ（`vX.Y.Z`形式）が自動作成される
    5. タグをリモートにpush（`git push --follow-tags`）
  - **Permissions**: 
    - `contents: write`（コミット・タグpushのため）
  - **参考**: [spec/semantic_versioning.md](./spec/semantic_versioning.md)の「バージョン番号の管理方法」セクション

### Docker Releaseワークフロー作成

- [x] `.github/workflows/docker-release.yml`を作成
  - **目的**: Gitタグ（`v*`形式）のpush時に、DockerイメージをビルドしてDockerHubにpushする
  - **トリガー**: `push: tags: ['v*']`
  - **環境変数**:
    - `IMAGE_NAME: tkuni83/relavue-er`
  - **ジョブ内容**:
    1. リポジトリをチェックアウト（`actions/checkout@v5`）
    2. QEMUのセットアップ（`docker/setup-qemu-action@v3`）- マルチアーキビルドのため
    3. Docker Buildxのセットアップ（`docker/setup-buildx-action@v3`）
    4. Docker Hubへログイン（`docker/login-action@v3`）
       - `username: ${{ secrets.DOCKERHUB_USERNAME }}`
       - `password: ${{ secrets.DOCKERHUB_TOKEN }}`
    5. Dockerメタデータの抽出（`docker/metadata-action@v5`）
       - タグ生成:
         - `type=semver,pattern={{version}}` → `X.Y.Z`（不変タグ）
         - `type=semver,pattern={{major}}` → `X`（MAJORバージョン最新）
         - `type=raw,value=latest` → `latest`（最新安定版）
       - ラベル生成:
         - `org.opencontainers.image.source=https://github.com/t-kuni/relavue-er`
         - `org.opencontainers.image.revision=${{ github.sha }}`（トレーサビリティのため）
    6. Dockerイメージのビルドとpush（`docker/build-push-action@v6`）
       - `context: .`
       - `file: ./Dockerfile.prod`
       - `platforms: linux/amd64,linux/arm64`
       - `push: true`
       - `tags: ${{ steps.meta.outputs.tags }}`
       - `labels: ${{ steps.meta.outputs.labels }}`
       - `cache-from: type=gha`（GitHub Actions Cacheを利用）
       - `cache-to: type=gha,mode=max`
    7. GitHub Releaseの作成
       - `gh release create ${{ github.ref_name }} --generate-notes`を使用
       - リリースノートは自動生成（コミット履歴から）
  - **Permissions**:
    - `contents: read`（チェックアウトのため）
    - `contents: write`（GitHub Release作成のため）
  - **参考**: 
    - [spec/semantic_versioning.md](./spec/semantic_versioning.md)の「Dockerイメージのタグ戦略」「DockerHubへのプッシュ」「CHANGELOG」「トレーサビリティ」セクション
    - [research/20260211_1153_semantic_versioning_strategy.md](./research/20260211_1153_semantic_versioning_strategy.md)の4章、5章

### npm設定ファイルの作成（オプション）

- [x] `.npmrc`ファイルを作成
  - **目的**: `npm version`コマンドの挙動を明示的に設定
  - **内容**:
    ```
    tag-version-prefix="v"
    ```
  - **理由**: デフォルトでも`v`がprefixとして付与されるが、明示的に設定することで予期しない動作を防ぐ
  - **参考**: [spec/semantic_versioning.md](./spec/semantic_versioning.md)の「Gitタグ」セクション

### バージョン同期検証の追加（将来的な改善提案）

- [x] 事前修正提案: `.github/workflows/docker-release.yml`にバージョン同期検証ステップを追加
  - **目的**: Gitタグ（`v`除去）とpackage.jsonのversionが一致しているかを検証し、不一致の場合は失敗させる
  - **タイミング**: Dockerビルド前
  - **実装案**:
    ```yaml
    - name: Verify version sync
      run: |
        GIT_TAG_VERSION=${GITHUB_REF_NAME#v}
        PKG_VERSION=$(node -p "require('./package.json').version")
        if [ "$GIT_TAG_VERSION" != "$PKG_VERSION" ]; then
          echo "Version mismatch: Git tag ($GIT_TAG_VERSION) != package.json ($PKG_VERSION)"
          exit 1
        fi
    ```
  - **理由**: 仕様書の「package.json、Gitタグ、Dockerタグの同期」セクションで破綻防止策として記載されている
  - **参考**: [spec/semantic_versioning.md](./spec/semantic_versioning.md)の「package.json、Gitタグ、Dockerタグの同期」セクション

## フェーズ2: Dockerfileの改修とビルド確認

### Dockerfileへのビルドメタデータ追加

- [ ] `Dockerfile.prod`にビルドARGとOCIラベルを追加
  - **編集箇所**: Stage 3（Production runner）セクション
  - **追加内容**:
    ```dockerfile
    # ============================================
    # Stage 3: Production runner
    # ============================================
    FROM node:20-alpine AS runner
    
    # Build arguments for metadata
    ARG GIT_SHA
    ARG BUILD_DATE
    
    WORKDIR /app
    
    # ... 既存の内容 ...
    
    # Add OCI labels for traceability
    LABEL org.opencontainers.image.source="https://github.com/t-kuni/relavue-er"
    LABEL org.opencontainers.image.revision="${GIT_SHA}"
    LABEL org.opencontainers.image.created="${BUILD_DATE}"
    
    # ... 既存のEXPOSEやCMD ...
    ```
  - **変更点の概要**: 
    - ビルド時にGit SHAとビルド日時を受け取れるようにARGを追加
    - OCIラベルとしてソース、リビジョン、作成日時を記録
  - **理由**: トレーサビリティの確保。実行中のDockerイメージがどのコミットから作られたかを追跡可能にする
  - **参考**: [spec/semantic_versioning.md](./spec/semantic_versioning.md)の「トレーサビリティ」セクション

### GitHub Actionsワークフローの修正

- [ ] `.github/workflows/docker-release.yml`のビルドステップにbuild-argsを追加
  - **編集箇所**: `docker/build-push-action@v6`の`with`セクション
  - **追加内容**:
    ```yaml
    build-args: |
      GIT_SHA=${{ github.sha }}
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
    ```
  - **理由**: Dockerfileで定義したARGに値を渡すため

### コード生成の実行

- [ ] `npm run generate`を実行
  - **目的**: TypeSpec（main.tsp）から型定義を生成し、最新の状態にする
  - **理由**: ビルド前に必要な型定義ファイルを生成する必要がある

### ビルド確認

- [ ] `npm run build`を実行してビルドが成功することを確認
  - **目的**: バックエンドとフロントエンドのビルドが正常に完了することを検証
  - **理由**: GitHub Actionsで実行される前にローカルでビルドエラーがないか確認する

### テスト実行

- [ ] `npm run test`を実行してテストが通ることを確認
  - **目的**: 既存のテストが全て成功することを検証
  - **理由**: 仕様追加によって既存機能に影響がないことを確認する

## 事前確認事項（実装前に確認が必要）

### GitHub Secretsの設定確認

- [ ] 実装後のアクション: GitHubリポジトリにSecretsを設定
  - **設定が必要なSecrets**:
    - `DOCKERHUB_USERNAME`: Docker Hubのユーザー名（例: `tkuni83`）
    - `DOCKERHUB_TOKEN`: Docker Hub Personal Access Token
  - **設定方法**: GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」→「New repository secret」
  - **参考**: [spec/semantic_versioning.md](./spec/semantic_versioning.md)の「DockerHubへのプッシュ」→「認証」セクション
  - **注意**: これはGitHub上での手動設定作業のため、コード実装タスクには含まれない

## 補足説明

### バージョニングフロー全体像

1. 開発者がmainブランチに変更をマージ
2. GitHub Actionsの「Version Bump and Tag」workflowを手動実行（bumpタイプを選択）
3. `npm version`がpackage.jsonを更新し、コミットとGitタグ（`vX.Y.Z`）を作成
4. タグがリモートにpushされる
5. タグpushをトリガーに「Docker Release」workflowが自動起動
6. Dockerイメージがビルドされ、以下のタグでDockerHubにpush:
   - `X.Y.Z`（不変）
   - `X`（MAJOR最新）
   - `latest`（最新）
7. GitHub Releaseが自動作成され、リリースノートが生成される

### 互換性の定義

以下の変更が発生した場合にMAJORバージョンを上げる必要がある：
- Docker実行時のI/F変更（環境変数、ポート番号、ボリュームマウント等）
- ER図JSONフォーマットの変更
- インポート/エクスポートのJSON形式変更

詳細は[spec/semantic_versioning.md](./spec/semantic_versioning.md)の「互換性（Public API）の範囲」を参照。
