import { useAuth } from '../lib/AuthContext'

export default function Dashboard() {
  const { employee, signOut } = useAuth()

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>単価表アプリ</h1>
        <div className="user-info">
          <span>{employee?.name ?? employee?.email ?? 'ログイン中'}さん</span>
          <button type="button" onClick={signOut}>
            ログアウト
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <p>
          単価表本体の画面は、共有の請求書テーブル構成が確定次第、実装予定です。
        </p>
      </main>
    </div>
  )
}
