import { useEffect, useState } from 'react'
import { apiRequest, setCsrfToken } from '../api/client.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const data = await apiRequest('/auth/me')
        if (!active) return
        setUser(data.user)
        setCsrfToken(data.csrfToken)
      } catch {
        if (!active) return
        setUser(null)
        setCsrfToken(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = window.setTimeout(() => {
      void bootstrap()
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  async function signup({ name, email, password }) {
    setError('')
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    })
    setUser(data.user)
    setCsrfToken(data.csrfToken)
    return data.user
  }

  async function login({ email, password }) {
    setError('')
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setUser(data.user)
    setCsrfToken(data.csrfToken)
    return data.user
  }

  async function logout() {
    setError('')
    await apiRequest('/auth/logout', { method: 'POST' })
    setUser(null)
    setCsrfToken(null)
  }

  async function refreshSession() {
    const data = await apiRequest('/auth/me')
    setUser(data.user)
    setCsrfToken(data.csrfToken)
    return data.user
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        signup,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
