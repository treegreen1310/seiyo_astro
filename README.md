# 星よみホロスコープ ― 使うほど詳しくなる

自分のホロスコープ（出生図）を作りながら、西洋占星術の読み方を少しずつ学べるWebアプリです。

- サイト：https://hoshiyomi.pages.dev/
- 天体計算：[Swiss Ephemeris](https://www.astro.com/swisseph)（© Astrodienst AG）を WebAssembly でブラウザ内で実行（[@kuntay/swisseph](https://github.com/kuntayerkus/swisseph-wasm)）
- 入力した生年月日などは、ブラウザの中だけで計算に使い、サーバーへは送信しません

## 主な機能

- ネイタル（一重円）と、ネイタル×トランジット（二重円）のホロスコープ
- 天体・感受点の一覧、アスペクトの一覧、ハウスカスプ
- 天体×サイン・天体×ハウス・アスペクトの組み合わせ別の解説
- 5ステップの「読み解きツアー」

## 動かし方

Node.js が必要です。

```sh
npm install
npm run dev      # 開発用サーバー
npm run build    # 公開用のファイルを dist/ に作成
```

## ブランチ

| ブランチ | 内容 | サイト |
|---|---|---|
| `main` | 現在の版 | https://hoshiyomi.pages.dev/ |
| `legacy-astro-horoscope` | 以前公開した版（変更しません） | https://astro-horoscope.pages.dev/ |
| `legacy-astro-chart` | 以前公開した版（変更しません） | https://astro-chart-81v.pages.dev/ |

## ライセンス

このプログラムと解説文は、[GNU Affero General Public License v3.0](LICENSE)（またはそれ以降のバージョン）で公開しています。
Swiss Ephemeris ほかの著作権表示は [NOTICE](NOTICE) をご覧ください。

このアプリは Astrodienst AG とは関係がなく、同社の承認・推奨を受けたものではありません。
