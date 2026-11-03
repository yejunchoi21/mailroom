import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Campaigns from './pages/Campaigns.jsx'
import Subscribers from './pages/Subscribers.jsx'
import Settings from './pages/Settings.jsx'
import './App.css'

const PAGES = {
  campaigns: Campaigns,
  subscribers: Subscribers,
  settings: Settings,
}

function App() {
  const [activePage, setActivePage] = useState('campaigns')
  const Page = PAGES[activePage]

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="app-main" id="main-content">
        <Page />
      </main>
    </div>
  )
}

export default App
