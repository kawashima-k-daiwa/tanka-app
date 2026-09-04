import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { status, signInWithGoogle, signOut } = useAuth()

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>単価表アプリ</h1>
        <p className="login-subtitle">ダイワエレクス株式会社 社内システム</p>

        {status === 'no-employee' && (
          <div className="login-message error">
            <p>社員登録がありません。</p>
            <p>予算管理システムの管理者にお問い合わせください。</p>
            <button type="button" className="text-button" onClick={signOut}>
              別のアカウントでログインする
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="login-message error">
            <p>認証情報の確認中にエラーが発生しました。時間をおいて再度お試しください。</p>
          </div>
        )}

        <button type="button" className="google-login-button" onClick={signInWithGoogle}>
          Googleアカウントでログイン
        </button>
        <p className="login-note">@daiwa-elecs.co.jp のアカウントのみ利用できます</p>
      </div>
    </div>
  )
}
