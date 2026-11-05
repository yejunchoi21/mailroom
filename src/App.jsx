import { useState } from 'react'
import { AuthProvider } from './auth/AuthContext.jsx'
import { useAuth } from './auth/useAuth.js'
import Sidebar from './components/Sidebar.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Campaigns from './pages/Campaigns.jsx'
import Subscribers from './pages/Subscribers.jsx'
import Settings from './pages/Settings.jsx'
import './App.css'

const PAGES = {
  campaigns: Campaigns,
  subscribers: Subscribers,
  settings: Settings,
}

function AuthenticatedApp() {
  const { user, loading, logout } = useAuth()
  const [activePage, setActivePage] = useState('campaigns')
  const Page = PAGES[activePage]

  if (loading) {
    return (
      <div className="app-loading" role="status">
        Loading Mailroom…
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  async function handleLogout() {
    await logout()
    setActivePage('campaigns')
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={handleLogout}
      />
      <main className="app-main" id="main-content">
        <Page />
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
