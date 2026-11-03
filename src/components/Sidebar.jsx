import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'settings', label: 'Settings' },
]

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <p className="sidebar__name">Mailroom</p>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = activePage === id

            return (
              <li key={id}>
                <button
                  type="button"
                  className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(id)}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
