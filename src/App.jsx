import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PriceList from './pages/PriceList'
import PriceComparison from './pages/PriceComparison'

function RequireEmployee({ children }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return <div className="loading-screen">読み込み中...</div>
  }

  if (status !== 'ready') {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const { status } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={status === 'ready' ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <RequireEmployee>
            <Dashboard />
          </RequireEmployee>
        }
      />
      <Route
        path="/prices"
        element={
          <RequireEmployee>
            <PriceList />
          </RequireEmployee>
        }
      />
      <Route
        path="/prices/compare"
        element={
          <RequireEmployee>
            <PriceComparison />
          </RequireEmployee>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
