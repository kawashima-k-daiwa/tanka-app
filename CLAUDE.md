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
   - **未確認事項**: `shared_invoice_lines` / `shared_import_batches` の**カラム構成はまだ未確認**。単価表本体の画面に着手する前に、実際のカラム名・型をUedaに確認すること。
   - 既存のテーブル（`employees`、`yosan_` から始まるテーブル、および共有の請求書テーブル）の**中身やRLSポリシーを変更・削除しない**。このアプリからは読み取りのみで十分。

3. **認証の仕組み（予算管理システムと共通）**
   - 新しい認証の仕組みを独自に作らない。予算管理システムと同じ仕組みを使い回す。
   - Supabase AuthのGoogleログイン。`@daiwa-elecs.co.jp` ドメインのみ許可（`signInWithOAuth` の `hd` オプション + クライアント側でのドメインチェックの二重で担保。実装: [src/lib/AuthContext.jsx](src/lib/AuthContext.jsx)）。
   - ログイン後、共有の `employees` テーブルに本人の登録があるか確認する。なければ「社員登録がありません」と表示する（ログイン画面: [src/pages/Login.jsx](src/pages/Login.jsx)）。
   - **未確認事項**: `employees` テーブルの実際のカラム名（メールアドレス列の名前など）は現状 `email` と仮定している（[src/lib/AuthContext.jsx](src/lib/AuthContext.jsx) 内の `.eq('email', email)` 部分）。Uedaに確認後、実際のカラム名に合わせて修正すること。

4. **このアプリ独自のテーブル**
   - 作る場合は、他システムと衝突しないよう `tanka_` プレフィックスを付ける。

## 現在の実装状況

- [x] Vite + React プロジェクトの初期化
- [x] Supabase接続の雛形（`.env.example`、[src/lib/supabase.js](src/lib/supabase.js)）
- [x] ログイン画面（Googleログイン・ドメイン制限・`employees`確認、未登録者の表示）
- [x] ログイン後の仮ダッシュボード画面（[src/pages/Dashboard.jsx](src/pages/Dashboard.jsx)）
- [ ] 単価表本体の画面 — **`shared_invoice_lines` / `shared_import_batches` のカラム構成が確定してから着手する**（テーブル名は確認済み）

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
