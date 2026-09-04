import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabaseの接続情報が設定されていません。.env.example を参考に .env を作成してください。'
  )
}

// 予算管理システム(yosan-kanri)と同じSupabaseプロジェクトを共有しています。
// employees / yosan_* テーブルおよび請求書共有テーブルへは読み取りのみを行い、
// スキーマやRLSポリシーの変更は行わないでください。詳細は CLAUDE.md を参照。
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
