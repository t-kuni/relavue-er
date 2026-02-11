# 🟦 開発者向け情報

## 🟠 前提条件

- Node.js 18以上
- Docker & Docker Compose
- TypeScript 5.0以上

## 🟠 環境構築

```bash
# .envファイルをコピー
cp .env.example .env

# 必要に応じてDB設定を変更
vi .env

# バックエンドの依存関係のインストール
npm install

# フロントエンドの依存関係のインストール
cd public && npm install

# コード生成
npm run generate

# 起動
npm run dev

# ブラウザでアクセス
open http://localhost:5173
```

## 🟠 テストコード実行

```bash
npm run generate
npm run test
```

## 🟠 バージョンリリース運用

### リリースフロー

1. **変更をmainブランチに集約**
   ```bash
   # PRをマージしてmainを最新にする
   git checkout main
   git pull origin main
   ```

2. **GitHub Actionsでバージョン更新**
   - GitHub Actionsの「Version Bump and Tag」workflowを手動実行
   - 実行方法：
     1. GitHubリポジトリの「Actions」タブを開く
     2. 「Version Bump and Tag」workflowを選択
     3. 「Run workflow」をクリック
     4. バージョンタイプを選択（`major` / `minor` / `patch`）
     5. 「Run workflow」を実行
   
   バージョンタイプの選択基準：
   - `major`: 互換性を壊す変更（例：Docker I/F変更、JSON形式変更）
   - `minor`: 後方互換な機能追加（例：新機能追加）
   - `patch`: 後方互換なバグ修正（例：不具合修正）

3. **自動でタグ作成とDockerイメージpush**
   - workflow実行により以下が自動実行される：
     - `package.json`のバージョン更新
     - Gitタグ（`vX.Y.Z`）作成
     - タグのpush
   - タグpushにより「Docker Release」workflowが自動起動
   - DockerHubに以下のタグでイメージがpushされる：
     - `X.Y.Z`（不変タグ）
     - `X`（MAJORバージョン最新）
     - `latest`（最新安定版）

4. **リリース確認**
   ```bash
   # タグが作成されたか確認
   git fetch --tags
   git tag
   
   # DockerHubでイメージを確認
   # https://hub.docker.com/r/tkuni83/relavue-er/tags
   ```

### 手動でのコンテナイメージ更新（非推奨）

通常は上記の自動化フローを使用してください。
開発・検証目的で手動pushする場合のみ以下を使用：

```bash
docker build -f Dockerfile.prod -t tkuni83/relavue-er:dev .
docker push tkuni83/relavue-er:dev
```

### ロールバック方法

問題のあるバージョンがリリースされた場合：

1. **本番環境での対応**
   - Dockerイメージの不変タグ（例：`1.2.3`）を使用している場合
     ```bash
     # 以前の安定版タグに切り替え
     docker pull tkuni83/relavue-er:1.2.2
     docker run tkuni83/relavue-er:1.2.2
     ```

2. **修正版のリリース**
   - 誤リリースのタグは削除せず、修正版（PATCH）を新しく出す
   ```bash
   # 修正コミットをmainにマージ後
   # GitHub Actionsで「patch」を選択して実行
   ```

### トラブルシューティング

**GitHub Actionsが失敗する場合**

- Secretsが正しく設定されているか確認：
  - `DOCKERHUB_USERNAME`: Docker Hubユーザー名
  - `DOCKERHUB_TOKEN`: Docker Hub Personal Access Token

**タグとpackage.jsonのバージョンが不一致の場合**

```bash
# タグを削除して再実行
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# package.jsonを手動で修正してコミット
# 再度GitHub Actionsを実行
```

# 🟦 開発支援プロンプト

## 🟠 外部のLLMに投げる時の要件整理プロンプト

```
以下のリサーチプロンプトを作成して

* 要件
```

## 🟠 仕様検討プロンプト

```
以下を満たせる仕様を検討してください

* 達成したいこと
```

# 仕様書の変更からタスク洗い出しプロンプト

```
仕様書を更新してます。直前のコミットの差分を確認して、タスクを洗い出してください
```

## 🟠 バグの原因調査プロンプト

```
以下のバグの原因を調査してください

* バグの挙動
```

## 🟠 テストエラー解析プロンプト

```
テストのエラーの原因を調査してください
```

## 🟠 コマンド群

* `/init-worktree`
    * エージェントをworktreeで起動する場合は付与する
* `/commit`
    * コミットします