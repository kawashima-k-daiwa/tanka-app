import { Link } from 'react-router-dom'
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
        <Link to="/prices" className="primary-link">
          単価表を見る
        </Link>
      </main>
    </div>
  )
}
