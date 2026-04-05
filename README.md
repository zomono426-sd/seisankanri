# seisankanri

生産管理game

## 開発環境での実行方法

### 1. プロジェクトディレクトリへ移動

必ず `seisankanri` ディレクトリで実行してください。

```bash
cd /home/zomo/seisan/seisankanri
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 開発サーバー起動

```bash
npm run dev
```

このコマンドで以下が同時に起動します。

- フロントエンド (Vite): `http://localhost:5173/`
- バックエンド (Express API): `http://localhost:3001/`

## アクセス先の注意

- 画面を開くURLは `http://localhost:5173/` です。
- `http://localhost:3001/` はAPIサーバーです。
- バックエンドのヘルスチェックは `http://localhost:3001/health` です。

## よくあるエラー

### `npm ERR! enoent Could not read package.json`

`seisankanri` 以外のディレクトリで実行すると発生します。
必ずプロジェクト直下で `npm run dev` を実行してください。
