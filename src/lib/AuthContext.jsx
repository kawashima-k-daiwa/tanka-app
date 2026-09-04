import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const ALLOWED_DOMAIN = 'daiwa-elecs.co.jp'

const AuthContext = createContext(undefined)

// status: 'loading' | 'signed-out' | 'no-employee' | 'ready' | 'error'
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function checkEmployee() {
      if (!session?.user) {
        setEmployee(null)
        setStatus('signed-out')
        return
      }

      const email = session.user.email ?? ''
      if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
        await supabase.auth.signOut()
        if (!cancelled) {
          setEmployee(null)
          setStatus('signed-out')
        }
        return
      }

      setStatus('loading')

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('employeesテーブルの確認に失敗しました:', error)
        setEmployee(null)
        setStatus('error')
        return
      }

      if (!data) {
        setEmployee(null)
        setStatus('no-employee')
        return
      }

      setEmployee(data)
      setStatus('ready')
    }

    checkEmployee()

    return () => {
      cancelled = true
    }
  }, [session])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        hd: ALLOWED_DOMAIN,
        redirectTo: window.location.origin,
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = { session, employee, status, signInWithGoogle, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() は AuthProvider の内側で使用してください')
  return ctx
}
