import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import './AuthPage.css'

function AuthPage() {
  const { login, signup, error, setError } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setError('')
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        await signup({ name, email, password })
      } else {
        await login({ email, password })
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <p className="auth-card__brand">Mailroom</p>
        <h1 id="auth-heading" className="auth-card__title">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="auth-card__copy">
          Your campaigns and subscribers are stored in your Mailroom account.
        </p>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <div className="auth-card__field">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          <div className="auth-card__field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-card__field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </div>

          {formError || error ? (
            <p className="auth-card__error" role="alert">
              {formError || error}
            </p>
          ) : null}

          <button
            type="submit"
            className="auth-card__submit"
            disabled={submitting}
          >
            {submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="auth-card__switch">
          {mode === 'login' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                className="auth-card__link"
                onClick={() => {
                  setMode('signup')
                  setFormError('')
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                className="auth-card__link"
                onClick={() => {
                  setMode('login')
                  setFormError('')
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </section>
    </div>
  )
}

export default AuthPage
