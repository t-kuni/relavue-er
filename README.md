lang: [EN](README.md) | [JA](README_JA.md)

# RelavueER

RelavueER is a tool that reverses ER diagrams from databases and allows you to view them interactively in your browser with ease.

![](docs/1.gif)

### 🟠 Concept

* Ready to use
* Display-focused, interactive, and easy to view

### 🟠 Supported Databases

* MySQL
* PostgreSQL

### 🟠 Limitations

* Not designed to be integrated into CI pipelines
* Requires foreign keys to be defined in the database

## 🟦 Usage

### 🟠 For macOS / Windows (Docker Desktop)

1\. Start the container

```bash
docker run --pull=always --rm -p 30033:30033 tkuni83/relavue-er
```

2\. Access [http://localhost:30033](http://localhost:30033)

3\. Click the "Reverse from DB" button, enter your database connection information, and execute

**⚠️ Note**: To connect from the Docker container, use `host.docker.internal` instead of `localhost` for the Host.

![](docs/1.png)

<p align="center">
  <img src="docs/2.png" width="300">
</p>


### 🟠 For Linux

1\. Start the container

```bash
docker run --pull=always --rm --network host tkuni83/relavue-er
```

2\. Access [http://localhost:30033](http://localhost:30033)

3\. Click the "Reverse from DB" button, enter your database connection information, and execute

![](docs/1.png)

<p align="center">
  <img src="docs/2.png" width="300">
</p>

## 🟦 Features

### 🟠 Reverse Engineering from Database

Connect to your database and generate ER diagrams.

![](docs/reverse.gif)

### 🟠 Highlight Feature

When you hover over an entity, related tables are highlighted.
The same applies when hovering over foreign key columns.

![](docs/hover.gif)

### 🟠 Layout Optimization

Optimize entity placement by positioning related tables close to each other.

![](docs/optimize.gif)

### 🟠 Incremental Reverse Engineering

Supports incremental reverse engineering when database changes are made.
You can reverse while maintaining the existing ER diagram layout.

You can also view the differences.

![](docs/rev-inc.gif)

### 🟠 Add Notes

You can add memos and notes for reference.

![](docs/memo.gif)

### 🟠 Save and Load

Save and load ER diagrams using "Export" and "Import".
You can save with Ctrl + S, or drop a saved JSON file onto the screen to load it.

![](docs/export.png)


## 🟦 For Developers

See [README_DEVELOP.md](README_DEVELOP.md)
