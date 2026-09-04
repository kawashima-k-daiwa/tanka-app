# 単価表アプリ (tanka-app)

ダイワエレクス株式会社の社内向けWebアプリ。商社・仕入先からの請求書データ（部品ごとの単価・数量・業者名等）をもとに、

- 品目・業者ごとの価格推移を一覧表示
- 部品発注や見積作成の際に「どこが一番安いか」をすぐ確認できるようにする

ための社内向けツール。

## 技術構成

- React + Vite + react-router-dom
- Supabase（データベース・認証）
- 社内の別システム「予算管理システム（yosan-kanri）」と **同じSupabaseプロジェクトを共有** している
  （理由: 毎月の請求書データを両方のシステムで使うため、二重管理を避けるため）

## Supabaseとの関係・必ず守ること（重要）

このプロジェクトを触る際は、以下を必ず守ってください。次回以降のセッションでも同じ前提で作業してください。

1. **接続情報の扱い**
   - Supabaseの接続情報（URL・anon key）は別途安全な方法で共有される。受け取ったら `.env` に入れる。
   - `.env` は **絶対にコミットしない**。`.gitignore` に必ず含めること（現状含めてある）。
   - `.env.example` には値を入れず、キー名だけを残す。

2. **共有テーブル（読み取り専用）**
   - このアプリが読み取れるのは以下の共有テーブルのみ（2026-09-04 Uedaより確認）:
     - `shared_invoice_lines`（請求書明細の生データ）
     - `shared_import_batches`（取り込み記録）
     - `employees`（ログイン確認のためだけに利用。それ以外の用途では読み取らない）
   - 上記以外の既存テーブル（`yosan_` から始まるテーブルなど）はこのアプリから読み取れない・読み取らない。
   - 既存のテーブル（`employees`、`yosan_` から始まるテーブル、および共有の請求書テーブル）の**中身やRLSポリシーを変更・削除しない**。このアプリからは読み取りのみで十分。

   **`shared_invoice_lines`（請求書明細）カラム構成（2026-09-04 Uedaより確認）**

   | カラム名 | 型 | 内容 |
   |---|---|---|
   | id | uuid (PK) | |
   | import_batch_id | uuid (FK) | `shared_import_batches.id` と紐付け |
   | vendor_name | text | 業者名・仕入先名（マスタなし、エクセルのシート名をそのまま格納した文字列） |
   | row_no | int | 元エクセルのシート内での行番号（トレース用） |
   | invoice_date | date | 請求書の日付 |
   | project_no | text | 注番（生データのまま。当社の注番台帳との照合は未実施） |
   | staff_code | text | 担当者コード（`employees.personal_code`相当。突合は未実施） |
   | maker | text | メーカー名 |
   | part_no | text | 型式・品番（**業者ごとの独自コード。業者をまたいだ同一部品の自動判定はできない**） |
   | item_name | text | 品目名・名称 |
   | quantity | numeric | 数量 |
   | unit | text | 単位 |
   | unit_price | numeric | 単価 |
   | amount | numeric | 金額 |
   | created_at | timestamptz | レコード作成日時 |

   **`shared_import_batches`（取り込み記録）カラム構成（2026-09-04 Uedaより確認）**

   | カラム名 | 型 | 内容 |
   |---|---|---|
   | id | uuid (PK) | `shared_invoice_lines.import_batch_id` が参照するキー |
   | file_name | text | 取り込んだエクセルファイル名 |
   | imported_at | timestamptz | 取り込み日時 |
   | imported_by | text | 取り込み実行者（`personal_code`。手動SQL実行時はnull） |
   | row_count | int | 取り込んだ件数 |
   | note | text | 備考 |

   - 「対象月」「発行元」のような列は存在しない。対象月が必要な場合は `invoice_date` の範囲から都度計算する。
   - **重要な制約**: `vendor_name`はテキストのみでマスタが存在しない。`part_no`は業者ごとの独自コードで、**業者をまたいだ同一部品の自動判定はできない**。「どこが一番安いか」を横断比較する機能は、`item_name`/`maker`等での曖昧な突き合わせか、別途の突き合わせ用マスタ（`tanka_`プレフィックスで新設）が必要になる。実装前に方針をUedaおよび業務側と相談すること。

3. **認証の仕組み（予算管理システムと共通）**
   - 新しい認証の仕組みを独自に作らない。予算管理システムと同じ仕組みを使い回す。
   - Supabase AuthのGoogleログイン。`@daiwa-elecs.co.jp` ドメインのみ許可（`signInWithOAuth` の `hd` オプション + クライアント側でのドメインチェックの二重で担保。実装: [src/lib/AuthContext.jsx](src/lib/AuthContext.jsx)）。
   - ログイン後、共有の `employees` テーブルに本人の登録があるか確認する。なければ「社員登録がありません」と表示する（ログイン画面: [src/pages/Login.jsx](src/pages/Login.jsx)）。
   - `employees` テーブルのメールアドレス列は `email` で確認済み（2026-09-04 Ueda確認、既存RLSも同じ列名で本人確認している）。[src/lib/AuthContext.jsx](src/lib/AuthContext.jsx) の実装のとおりで問題なし。

4. **このアプリ独自のテーブル**
   - 作る場合は、他システムと衝突しないよう `tanka_` プレフィックスを付ける。

## 現在の実装状況

- [x] Vite + React プロジェクトの初期化
- [x] Supabase接続の雛形（`.env.example`、[src/lib/supabase.js](src/lib/supabase.js)）
- [x] ログイン画面（Googleログイン・ドメイン制限・`employees`確認、未登録者の表示）
- [x] ログイン後の仮ダッシュボード画面（[src/pages/Dashboard.jsx](src/pages/Dashboard.jsx)）
- [x] 単価表本体の画面
      - **明細一覧**（[src/pages/PriceList.jsx](src/pages/PriceList.jsx)）: 品目名・メーカー・型式品番・業者名・期間で `shared_invoice_lines` を検索し、単価・請求日でソートして一覧表示（生データそのまま、正規化なし）
      - **価格比較**（[src/pages/PriceComparison.jsx](src/pages/PriceComparison.jsx)）: 「品目名・メーカー・型番」が**完全一致**する行をまとめ、業者名を列にしたピボット表で表示（過去のExcelツールの「単価一覧」シートと同じ見た目）。行内で最安の単価セルを緑色で強調。あいまい一致・自動マスタ突合はしない。表のヘッダー行は縦スクロール時に固定表示
      - 表記ゆれ補正・分類ルール（[src/lib/priceNormalization.js](src/lib/priceNormalization.js)）: 過去にPythonで作成していた `create_tanka_v2.py`（社内の単価表.xlsx生成ツール）のロジックを移植
        - メーカー名補正（OMRON→オムロン 等）、品目名補正（POWER SUPPLY→パワーサプライ 等）
        - 業者別特殊ルール（住友産業→品目名を「ビス関連」に統一、ライト→型番プレフィックスでメーカー補正）
        - メーカー×型番プレフィックスによる品目名上書き（富士SC→マグネット 等）
        - 業者×型番プレフィックスによる品目名上書き（サンセイテクノス: BN始まり→端子台、ABN始まり→押しボタン）
        - 校正費・返品を含む行は価格比較から除外
        - 自社注文番号らしき型番（英字2+数字2+英字1）は赤字強調
      - 新しい表記ゆれ・分類ルールを追加する場合は [src/lib/priceNormalization.js](src/lib/priceNormalization.js) に追記する運用（元のPythonツールと同じ追記型の運用を踏襲）
      - **業者をまたいだ同一部品の自動突き合わせ（型番が業者ごとに異なる場合）は未対応**。将来的に必要になれば `tanka_` プレフィックスの突き合わせ用マスタ新設を検討

## セットアップ

```bash
npm install
cp .env.example .env
# .env に Supabase の URL と anon key を入力してから
npm run dev
```

## Supabase Auth 側で必要な設定（予算管理システムと共有プロジェクト側での作業）

- Google OAuth プロバイダーが有効になっていること
- リダイレクトURLにこのアプリの開発・本番URLが登録されていること
- これらは共有Supabaseプロジェクトの設定なので、予算管理システム側の担当者と調整すること
