import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'settings', label: 'Settings' },
]

function Sidebar({ activePage, onNavigate, user, onLogout }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <p className="sidebar__name">Mailroom</p>
        {user ? (
          <p className="sidebar__user" title={user.email}>
            {user.name}
          </p>
        ) : null}
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

      {onLogout ? (
        <div className="sidebar__footer">
          <button
            type="button"
            className="sidebar__link sidebar__logout"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      ) : null}
    </aside>
  )
}

export default Sidebar
