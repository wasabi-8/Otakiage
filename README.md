# お焚き上げサイト

朱ろうそくを使った「お焚き上げ」サイト

## セットアップ

### 1. ろうそく画像の準備

`images/candle.png` に朱ろうそくの実写画像（炎なし）を配置してください。

推奨サイズ: 400px × 600px程度
フォーマット: PNG（背景透過）

### 2. ローカルサーバーの起動

```bash
cd otakiage-site
python -m http.server 8000
# または
py -m http.server 8000
```

ブラウザで `http://localhost:8000/` にアクセス

## 画像差し替え手順

1. `images/candle.png` - ろうそく本体の画像（炎なし）
2. `textures/paper1.jpg` ~ `paper4.jpg` - 和紙テクスチャ（既に配置済み）

## 技術スタック

- **PixiJS 7.3** - WebGL Shader による炎の描画
- **Canvas API** - 紙の焦げアニメーション
- 純粋な HTML/CSS/JavaScript（フレームワーク不使用）

## 機能

- リアルタイムで揺らめく炎（WebGL Shader）
- ランダムな和紙テクスチャ
- 不規則な焦げアニメーション
- レスポンシブ対応
