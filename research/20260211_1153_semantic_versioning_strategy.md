1. セマンティックバージョニングの基本方針

* 基本ルール：`MAJOR.MINOR.PATCH`

  * 互換性を壊す変更 → MAJOR
  * 後方互換な機能追加 → MINOR
  * 後方互換なバグ修正 → PATCH ([Semantic Versioning][1])
* このプロジェクトで「互換性（Public API）」とみなす範囲（例）

  * Docker実行時のI/F：環境変数、起動方法、公開ポート、永続化（ボリュームの意味）、入出力（ER図JSONの形式）、外部DB接続方法
  * ブラウザ機能で外部に影響する仕様：インポート/エクスポートJSON、DDL表示/保持の形式、URL/設定の互換性
* プレリリースとビルドメタデータ

  * プレリリース：`1.2.3-beta.1` のように `-` で付与（安定版より優先度が低い） ([Semantic Versioning][1])
  * ビルドメタデータ：`+` 以降（例 `+git.sha`）は SemVer 仕様としては可能 ([Semantic Versioning][1])
  * ただし Docker のタグには `+` を使えないため、ビルドメタデータはタグに入れず、OCIラベル（例：`org.opencontainers.image.revision`）へ入れる方針が現実的 ([GitHub][2])

2. バージョン番号の自動管理ツール（A/B/C）
   **選択肢A：Conventional Commitsベースで自動決定**（コミット規約が前提）

* Conventional Commits：仕様 v1.0.0 ([conventionalcommits.org][3])
* ツール候補（メジャーバージョン明記）

  * release-please：CLI v17 系（例：17.2.0）／ GitHub Action v4 系 ([GitHub][4])
  * semantic-release：v25 系 ([npm][5])
  * standard-version：v9 系（ただし非推奨扱いの流れが明記されている） ([GitHub][6])
  * commit-and-tag-version：v12 系（standard-version系の代替としてメンテ） ([npm][7])
* メリット

  * 変更内容から MAJOR/MINOR/PATCH を機械的に決められる
  * CHANGELOG / GitHub Releases まで一貫して自動化しやすい
* デメリット

  * コミットメッセージ規約（Conventional Commits）の徹底が必要 ([conventionalcommits.org][3])

**選択肢B：npmコマンド（npm version major/minor/patch）**

* npm CLI：v11 系が “Latest” として案内されている（例：11.9.0） ([docs.npmjs.com][8])
* `npm version` は（git管理下なら）バージョンコミット＋タグ作成も行う挙動がドキュメントにある ([docs.npmjs.com][9])
* `tag-version-prefix` のデフォルトは `"v"`（= gitタグが `v1.2.3` になりやすい） ([docs.npmjs.com][10])
* メリット

  * 追加ツール不要で最短導入
  * 「今回は major/minor/patch どれか」を指定するだけで数値が自動更新される
* デメリット

  * 変更内容に基づく自動判定（= “今回はどれ？” を人が決める）は残る

**選択肢C：workflow_dispatchで手動トリガー＋バージョンタイプ選択**

* 仕組み：GitHub Actions の入力（major/minor/patch）を受け取り、`npm version` 等を実行→タグ作成→push
* メリット

  * リリースタイミングを人が握りつつ、番号付け・タグ付け・Docker push は自動化できる
* デメリット

  * 完全自動ではない（毎回 Actions の実行が必要）

3. Gitタグの付与方法とタイミング（A/B/C）
   **選択肢A：事前に手動でタグ→タグをトリガーにCI**

* 実装

  * `git tag vX.Y.Z` → `git push origin vX.Y.Z`
  * Actions：`on: push: tags: ['v*']` でビルド/プッシュ
* 運用フロー

  1. main に変更を揃える → 2) 手元でタグ → 3) push → 4) CIがDocker push
* メリット

  * 「このコミットがこのバージョン」と確実に固定
* デメリット

  * タグ作成が手作業

**選択肢B：mainマージ時に自動でバージョン決定しタグ付与**

* 実装案

  * release-please（PR方式）または semantic-release（直接リリース）で自動タグ ([GitHub][11])
* 運用フロー（release-please例）

  1. 通常PRをmainへ → 2) 自動で「リリースPR」が作られる → 3) リリースPRをマージ → 4) タグ作成＋Release作成 → 5) タグ起点でDocker push
* メリット

  * ほぼ全自動
* デメリット

  * Conventional Commits 徹底が前提になりやすい ([conventionalcommits.org][3])

**選択肢C：workflow_dispatch実行時にタグ自動付与**

* 実装

  * Actions で `inputs: bump: [major,minor,patch]` を受け、`npm version $bump`→`git push --follow-tags`
* 運用フロー

  1. main に変更を揃える → 2) Actions 実行（bump選択） → 3) タグ作成＆push → 4) 別workflow（タグpush）でDocker push

4. DockerHubへのイメージプッシュ自動化（A/B）
   **選択肢A：GitHub Actionsで自動化**

* 推奨：実施（手動pushのヒューマンエラーを減らし、タグと成果物を常に一致させやすい）
* 認証：Docker Hub はパスワードではなく Personal Access Token を推奨 ([GitHub][12])
* マルチアーキ：`docker/setup-qemu-action`＋`docker/setup-buildx-action` を利用 ([GitHub][13])
* キャッシュ：GitHub Actions Cache（`type=gha`）が推奨されている ([Docker Documentation][14])
* ワークフロー例（タグpushで build & push、amd64/arm64、キャッシュ有効、Dockerfile.prod 使用）

```yaml
name: docker-release

on:
  push:
    tags:
      - "v*"

env:
  IMAGE_NAME: tkuni83/relavue-er

jobs:
  build_and_push:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v5 # v5系
      # actions/checkout v5.0.0 リリース :contentReference[oaicite:18]{index=18}

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3 # v3系
      # v3.7.0 など :contentReference[oaicite:19]{index=19}

      - name: Set up Buildx
        uses: docker/setup-buildx-action@v3 # v3系
      # v3.12.0 など :contentReference[oaicite:20]{index=20}

      - name: Login to Docker Hub
        uses: docker/login-action@v3 # v3系
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      # PAT推奨 :contentReference[oaicite:21]{index=21}

      - name: Extract Docker metadata (tags/labels)
        id: meta
        uses: docker/metadata-action@v5 # v5系
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}
            type=raw,value=latest
          labels: |
            org.opencontainers.image.source=https://github.com/t-kuni/relavue-er
      # タグ/ラベル生成の方針 :contentReference[oaicite:22]{index=22}

      - name: Build and push
        uses: docker/build-push-action@v6 # v6系
        with:
          context: .
          file: ./Dockerfile.prod
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      # build-push-action v6系 :contentReference[oaicite:23]{index=23}
```

* Secrets（GitHub側）

  * `DOCKERHUB_USERNAME`：Docker Hubユーザー名
  * `DOCKERHUB_TOKEN`：Docker Hub Personal Access Token ([GitHub][12])

**選択肢B：ローカルで継続**

* メリット：設定不要
* デメリット：タグ付け忘れ・push忘れ・別環境差分などが起きやすい

5. Dockerイメージのタグ戦略（A/B/C）
   前提：Dockerタグは `+` を使えない（= SemVerのビルドメタデータはタグに載せない） ([GitHub][2])

**選択肢A：`1.2.3` のみ**

* 運用：リリースごとに `1.2.3` を追加（過去タグは不変）
* メリット：不変・明確
* デメリット：利用者が「最新」を選びにくい

**選択肢B：`1.2.3` + `latest`**

* 運用：安定版リリースのたびに `latest` を同じdigestへ更新
* メリット：利用者が最新版を取りやすい
* デメリット：`latest` は可変なので、再現性目的には不向き（利用者向けに注意書きが必要）
* タグ運用の一般論として、用途を明確にして併用するのが推奨されやすい ([Docker][15])

**選択肢C：`1.2.3` + `1` + `latest`**

* 運用：

  * `1.2.3`：常に不変
  * `1`：同一MAJORの最新（例：1.2.3 へ更新）
  * `latest`：最新安定版へ更新
* メリット：

  * 利用者が「MAJOR固定で自動追従」しやすい（`1` を使う）
* デメリット：可変タグが増えて運用ルールの周知が必要

6. プレリリース版やベータ版の扱い（A/B/C）
   **選択肢A：SemVerプレリリース（例 `1.2.3-beta.1`）**

* 運用：gitタグも `v1.2.3-beta.1`、Dockerタグは `1.2.3-beta.1`
* メリット：SemVer準拠で履歴が追いやすい ([Semantic Versioning][1])
* デメリット：タグ数が増える

**選択肢B：Dockerタグを `dev` / `beta` 等に固定**

* 運用：main の最新を `dev`、特定ブランチを `beta` など
* メリット：運用が単純
* デメリット：そのタグが「どの版か」を追跡しづらい（可変タグ問題が強い）

**選択肢C：プレリリースを作らない**

* メリット：最小運用
* デメリット：事前検証を「どのバイナリ（イメージ）で行ったか」固定しづらい

7. CHANGELOGの自動生成（A/B/C）
   **選択肢A：自動生成ツール**

* 候補（メジャーバージョン明記）

  * release-please（CLI v17 / Action v4）：リリースノート/CHANGELOG生成まで含めやすい ([GitHub][4])
  * commit-and-tag-version v12：CHANGELOG生成＋タグ作成をまとめて実行しやすい ([npm][7])
* メリット：リリース作業が定型化
* デメリット：Conventional Commits 運用に寄りやすい ([conventionalcommits.org][3])

**選択肢B：手動記述**

* メリット：重要な変更だけ書ける
* デメリット：更新漏れが起きやすい

**選択肢C：作成しない**

* メリット：運用コスト最小
* デメリット：利用者が変更点を追いづらい

8. GitHub Releasesの活用（A/B）
   前提：GitHub Releases は Gitタグに基づく ([GitHub Docs][16])

**選択肢A：Releasesを使う**

* 運用：タグ作成に合わせて Release（pre-release含む）を作る
* 実装：release-please/semantic-release、または `gh release create` ([GitHub Docs][17])
* メリット：UIで履歴とリリースノートを整理できる
* デメリット：ノート生成/記述の運用が必要（自動化で軽減可能）

**選択肢B：タグのみ**

* メリット：最小
* デメリット：リリース情報が見つけづらい

9. package.jsonバージョンとの同期（package.json / Gitタグ / Dockerタグ）

* 基本方針（推奨）：**Gitタグを起点にDockerタグを生成し、package.jsonはタグと一致させる**

  * Gitタグ → Dockerタグ：`docker/metadata-action` の `type=semver` で `v` を含むタグからでも生成しやすい ([Docker Documentation][18])
  * package.json → Gitタグ：`npm version` が gitタグのprefixとして `"v"` を既定に持つ（`v1.2.3` になりやすい） ([docs.npmjs.com][10])
* 自動化パターン

  * release-please：release PR に version 更新が入り、マージでタグが切られる（同期点が1つになりやすい） ([GitHub][11])
  * npm version：version更新＋コミット＋タグ（挙動はドキュメントにある） ([docs.npmjs.com][9])
* 破綻防止（CIチェック案）

  * タグpush時に「タグ（v除去）＝ package.json version」を検証し、ズレていたら失敗

10. ロールバック戦略

* Dockerイメージの切り戻し

  * **不変タグ（`1.2.3`）へピン留め**している利用者は、そのタグに戻せば復旧
  * `latest` / `1` のような可変タグ運用時は、緊急時にそれらを旧版digestへ付け替える（ただし「いつから何に変わったか」の記録が必要）
* Gitタグの扱い

  * 公開済みタグの削除・付け替えは混乱しやすいので、原則「修正版（PATCH）を新しく出す」運用が安全寄り
  * どうしても誤タグを消す場合は「ローカル削除＋リモート削除」が必要（ただし公開後は非推奨）
* 影響最小化

  * 利用者向けに「本番は `1.2.3` のような不変タグ推奨、`latest` は検証/手軽用途」と明記
  * イメージへ OCIラベルで `revision`（git sha）を埋め、実行中の個体がどのコミットか追えるようにする ([https://opencontainers.github.io][19])

11. 推奨される実装方針（推奨度順）
    **提案1（プロトタイピング段階向け・導入最短）：workflow_dispatch（選択肢C）＋npm version（選択肢B）＋タグpushでDocker自動push**

* ツール：npm CLI v11 系（`npm version major|minor|patch`） ([docs.npmjs.com][8])
* Gitタグ：Actionsが作成（`vX.Y.Z`）／Dockerタグ：`X.Y.Z`＋`1`＋`latest`（選択肢C）
* Actions設計：

  * Workflow A：workflow_dispatch → `npm version` → `git push --follow-tags`
  * Workflow B：`on: push: tags: ['v*']` → Docker build/push（4章の例）
* CHANGELOG / Releases：最初は GitHub Releases の自動生成リリースノートで代替可 ([GitHub Docs][20])
* メリット：コミット規約を強制せず、番号付けミスとpush漏れを潰せる
* デメリット：MAJOR/MINOR/PATCHの判断は人が行う
* 実装の複雑さ：低（現状の手動運用から段階導入しやすい）
* 運用フロー例：

  1. main に変更を集約 → 2) Actions で bump を選んで実行 → 3) タグpush → 4) DockerHub に `X.Y.Z`,`1`,`latest` が出る

**提案2（中長期の標準化寄り）：release-please（選択肢A）＋タグpushでDocker自動push**

* ツール：release-please CLI v17 / Action v4 ([GitHub][4])
* Gitタグ：release PR マージで自動
* Actions設計：

  * release-please workflow（main更新で release PR 作成）
  * タグpush workflow（Docker build/push）
* Dockerタグ：選択肢C（`X.Y.Z`,`1`,`latest`）
* CHANGELOG / Releases：release-pleaseで自動化しやすい
* メリット：リリース作業がPRに集約され、履歴と成果物が揃う
* デメリット：Conventional Commits の運用が必要 ([conventionalcommits.org][3])
* 実装の複雑さ：中

**提案3（完全自動化寄り）：semantic-release（選択肢A）で main マージ時に自動リリース＋Docker push**

* ツール：semantic-release v25 ([npm][5])
* Gitタグ：mainへのマージで自動
* Dockerタグ：選択肢C
* メリット：リリース判断まで自動化できる
* デメリット：規約運用＋設定が重くなりやすい
* 実装の複雑さ：高

[1]: https://semver.org/?utm_source=chatgpt.com "Semantic Versioning 2.0.0 | Semantic Versioning"
[2]: https://github.com/moby/moby/issues/16304?utm_source=chatgpt.com "enhancement: allow `+` in tag names · Issue #16304"
[3]: https://www.conventionalcommits.org/en/v1.0.0/?utm_source=chatgpt.com "Conventional Commits"
[4]: https://github.com/googleapis/release-please-action/releases?utm_source=chatgpt.com "googleapis/release-please-action"
[5]: https://www.npmjs.com/package/semantic-release?utm_source=chatgpt.com "semantic-release"
[6]: https://github.com/conventional-changelog/standard-version/releases?utm_source=chatgpt.com "Releases · conventional-changelog/standard-version"
[7]: https://www.npmjs.com/package/commit-and-tag-version?activeTab=readme&utm_source=chatgpt.com "commit-and-tag-version"
[8]: https://docs.npmjs.com/cli/v11/configuring-npm/install/?utm_source=chatgpt.com "install | npm Docs"
[9]: https://docs.npmjs.com/cli/v7/commands/npm-version/?utm_source=chatgpt.com "npm-version"
[10]: https://docs.npmjs.com/cli/v8/using-npm/config?utm_source=chatgpt.com "Config"
[11]: https://github.com/googleapis/release-please-action?utm_source=chatgpt.com "googleapis/release-please-action"
[12]: https://github.com/docker/login-action?utm_source=chatgpt.com "GitHub Action to login against a Docker registry"
[13]: https://github.com/docker/setup-qemu-action/releases?utm_source=chatgpt.com "Releases · docker/setup-qemu-action"
[14]: https://docs.docker.com/build/cache/backends/gha/?utm_source=chatgpt.com "GitHub Actions cache"
[15]: https://www.docker.com/blog/docker-best-practices-using-tags-and-labels-to-manage-docker-image-sprawl/?utm_source=chatgpt.com "Using Tags and Labels to Manage Docker Image Sprawl"
[16]: https://docs.github.com/repositories/releasing-projects-on-github/about-releases?utm_source=chatgpt.com "About releases - GitHub Docs"
[17]: https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository?utm_source=chatgpt.com "Managing releases in a repository"
[18]: https://docs.docker.com/build/ci/github-actions/manage-tags-labels/?utm_source=chatgpt.com "Manage tags and labels with GitHub Actions"
[19]: https://specs.opencontainers.org/image-spec/annotations/?utm_source=chatgpt.com "The OpenContainers Annotations Spec"
[20]: https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes?utm_source=chatgpt.com "Automatically generated release notes"
