# RelavueER

RelavueER（レラビューアー）は、データベースからER図をリバースし、ブラウザ上で手軽にかつインタラクティブに閲覧できるツールです。

![](docs/1.gif)

### 🟠 コンセプト

* すぐ使える
* 表示特化・インタラクティブで見やすく

### 🟠 サポートしているDB

* MySQL
* PostgreSQL

### 🟠 できないこと

* CIに組み込むことは想定していません
* 外部キーが付与されてないと無力です

## 🟦 使用方法

### 🟠 macOS / Windows（Docker Desktop）の場合

1. コンテナを起動する

```bash
docker run --pull=always --rm -p 30033:30033 tkuni83/relavue-er
```

2. [http://localhost:30033](http://localhost:30033) にアクセスする

3.「DBからリバース」ボタンからDB接続情報を入力し実行する
    * **注意**: dockerコンテナから接続するためHostは`localhost`ではなく`host.docker.internal`となります。

![](docs/1.png)

![](docs/2.png)


### 🟠 Linux の場合

1. コンテナを起動する

```bash
docker run --pull=always --rm --network host tkuni83/relavue-er
```

2. [http://localhost:30033](http://localhost:30033) にアクセスする

3.「DBからリバース」ボタンからDB接続情報を入力し実行する

![](docs/1.png)

![](docs/2.png)

## 🟦 特徴

### 🟠 DBからリバースする

DBに接続してER図を作成します。

![](docs/reverse.gif)

### 🟠 ハイライト機能

エンティティにホバーすると関連するテーブルがハイライト表示されます。
外部キーのカラムにホバーした場合も同様です。

![](docs/hover.gif)

### 🟠 配置最適化

エンティティの配置を最適化し、関連のあるテーブルを近くに配置します。

![](docs/optimize.gif)

### 🟠 増分リバースに対応

DBに変更が入った場合の増分リバースに対応しています。
ER図の配置を維持したままリバースできます。

また、差分を閲覧できます。

![](docs/rev-inc.gif)

### 🟠 メモを書き込める

備忘録などメモを書き込んでおけます。

![](docs/memo.gif)

### 🟠 保存・読み込み

「エクスポート」「インポート」でER図を保存・読み込みできます。
Ctrl + S で保存できるほか、保存されたJSONを画面のドロップして読み込む事も可能です。

![](docs/export.png)


## 🟦 開発者向け情報

[README_DEVELOP.md](README_DEVELOP.md)を参照