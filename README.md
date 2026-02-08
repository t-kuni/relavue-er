# RelavueER

RelavueER（レラビューアー）は、データベースからER図をリバースし、ブラウザ上で手軽にかつインタラクティブに閲覧できるツールです。

![](docs/1.gif)

## 🟦 使用方法

### 🟠 macOS / Windows（Docker Desktop）の場合

1. コンテナを起動する

```bash
docker run --rm -p 30033:30033 tkuni83/relavue-er
```

2. [http://localhost:30033](http://localhost:30033) にアクセスする

3.「DBからリバース」ボタンからDB接続情報を入力し実行する

![](docs/1.png)

![](docs/2.png)

**注意**: dockerコンテナから接続するためHostは`localhost`ではなく`host.docker.internal`となります。

### 🟠 Linux の場合

1. コンテナを起動する

```bash
docker run --rm --network host tkuni83/relavue-er
```

2. [http://localhost:30033](http://localhost:30033) にアクセスする

3.「DBからリバース」ボタンからDB接続情報を入力し実行する

![](docs/1.png)

![](docs/2.png)

## 🟦 機能一覧

[こちら](https://zenn.dev/t_kuni_0/articles/ffecf4c2b7dbdb#%F0%9F%9F%A6-%E7%89%B9%E5%BE%B4) を参照ください。


## 🟦 開発者向け情報

[README_DEVELOP.md](README_DEVELOP.md)を参照