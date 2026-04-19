# タスク一覧

## 概要

仕様追加：DBからリバースモーダルのHost欄にDockerコンテナ向けコールアウトを追加。

仕様書: `spec/database_connection_settings.md`

---

## 変更内容

- Hostフィールドの下にDockerコンテナ向けの情報コールアウトを追加
- Hostフィールドのplaceholderを `localhost` → `host.docker.internal` に変更

---

## タスク

### 1. `DatabaseConnectionModal.tsx` を修正する

**対象ファイル**: `public/src/components/DatabaseConnectionModal.tsx`

**実装内容**:

- Host inputの `placeholder` を `localhost` から `host.docker.internal` に変更する
- Host inputの直後に以下の情報コールアウトを追加する
  - 背景色: 薄い青系（info系）
  - テキスト: i18nキー `database_modal.host_callout` を使用
  - 内容（日本語）:
    ```
    Dockerコンテナとして起動している場合
    ホストマシンを表す接続先は `host.docker.internal` です
    （localhostではありません。またLinuxの場合は `172.17.0.1` の可能性があります）
    ```

### 2. i18nファイルを更新する

**対象ファイル**: 以下3ファイルの `database_modal` セクションに `host_callout` キーを追加する

- `public/locales/ja/translation.json`
  ```
  "host_callout": "Dockerコンテナとして起動している場合\nホストマシンを表す接続先は host.docker.internal です\n（localhostではありません。またLinuxの場合は 172.17.0.1 の可能性があります）"
  ```
- `public/locales/en/translation.json`
  ```
  "host_callout": "If running as a Docker container\nThe host address for the host machine is host.docker.internal\n(Not localhost. On Linux, it may be 172.17.0.1)"
  ```
- `public/locales/zh/translation.json`
  ```
  "host_callout": "如果作为Docker容器运行\n表示宿主机的连接地址是 host.docker.internal\n（不是localhost。在Linux上可能是 172.17.0.1）"
  ```

### 3. ビルド確認

```bash
npm run generate
npm run test
```

---

## 現状

- [x] タスク1: DatabaseConnectionModal.tsx を修正
- [x] タスク2: i18nファイルを更新
- [x] タスク3: ビルド確認
