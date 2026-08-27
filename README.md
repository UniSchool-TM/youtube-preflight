# YouTube Preflight

YouTube動画の投稿前に、タイトル・サムネイル・概要欄・チャプター・ハッシュタグ・動画時間をブラウザ内でチェックする無料ツールです。

## 特徴

- **すべてブラウザ内で処理** — 判定にAI・外部API・APIキーは一切使いません。画像や入力内容が外部に送信されることはありません。
- **決定的なルールベース判定** — 同じ入力なら常に同じ結果。100点満点でカテゴリごとに理由付きでスコア表示。
- **統計解析** — サムネイルはCanvasによる色・コントラスト・視認性解析、タイトルは語の重要度（TF特有）・文字種・繰り返し・語彙化率などを解析。
- **比較機能** — 複数の入力案を保存して並べて比較。
- **履歴とエクスポート** — 診断結果をブラウザ内（LocalStorage / IndexedDB）に保存し、PNG画像やJSONで書き出せます。
- **PWA対応** — オフラインでも動作します。
- **ダークモード対応**。

## スコア配分（100点満点）

| カテゴリ | 配点 |
| --- | --- |
| サムネイル | 30点 |
| タイトル | 25点 |
| タイトル × サムネイル | 20点 |
| 概要欄 | 10点 |
| チャプター | 5点 |
| ハッシュタグ | 5点 |
| 技術的な指標 | 5点 |

各カテゴリには達成・警告・改善すべき点が理由付きで表示されます。

> 注意: 本ツールは投稿前チェック項目の達成度を独自基準でスコア化しています。CTRや再生数を予測するものではありません。

## 技術スタック

- Next.js 16（App Router / Turbopack）
- React 19
- Tailwind CSS v4（class ベースのダークモード）
- Vitest（ユニットテスト）
- Web Worker + Canvas（サムネイル解析）
- IndexedDB / LocalStorage（データ保存）

## ディレクトリ構成

```
src/
  app/              # 各ページ（/、/diagnose、/compare、/history、/settings、/about）
  components/       # UI部品（診断フォーム、結果表示、ガイド等）
  hooks/            # useHistory / useTheme / useSettings
  lib/              # 純粋ロジック（解析・スコアリング、テスト）
  workers/          # サムネイル解析用 Web Worker
public/
  sw.js             # 本番用 Service Worker（PWA）
```

## 開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) にアクセスしてください。

## テスト

```bash
npm test        # ユニットテスト（解析・スコアリング）
npm run lint    # ESLint
npm run build   # プロダクションビルド
```

## データとプライバシー

- 診断結果は `LocalStorage`（キー `yp_history_v1`、最大200件）、サムネイル画像は `IndexedDB` に保存されます。
- 外部へのデータ送信はありません。広告・トラッキングもありません。
- 「設定」から履歴・保存画像・全データをいつでも削除できます。

## ライセンス

MIT