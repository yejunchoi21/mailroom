import { useState } from 'react'
import { useSubscribers } from '../hooks/useSubscribers.js'
import SubscriberForm from '../components/SubscriberForm.jsx'
import SubscriberImport from '../components/SubscriberImport.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import './Subscribers.css'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function Subscribers() {
  const {
    subscribers,
    loading,
    saving,
    error,
    saveSubscriber,
    removeSubscriber,
    importValidRows,
    createEmptySubscriber,
  } = useSubscribers()

  const [searchQuery, setSearchQuery] = useState('')
  const [panel, setPanel] = useState(null)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [actionError, setActionError] = useState('')

  const query = searchQuery.trim().toLowerCase()
  const filtered = (
    !query
      ? subscribers
      : subscribers.filter(
          (subscriber) =>
            subscriber.name.toLowerCase().includes(query) ||
            subscriber.email.toLowerCase().includes(query),
        )
  )
    .slice()
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))

  async function handleSave(input) {
    const result = await saveSubscriber(input)
    if (!result.error) {
      setPanel(null)
      setEditing(null)
    }
    return result
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const result = await removeSubscriber(pendingDelete.id)
    if (result.error) {
      setActionError(result.error)
    }
    setPendingDelete(null)
  }

  return (
    <section className="page page--wide" aria-labelledby="subscribers-heading">
      <header className="page__header page__header--with-action">
        <div>
          <h1 id="subscribers-heading" className="page__heading">
            Subscribers
          </h1>
          <p className="page__demo-banner" role="note">
            Subscribers are saved to your signed-in account. Manually added
            contacts are labeled as test data.
          </p>
        </div>
        <div className="subscribers__header-actions">
          <button
            type="button"
            className="page__secondary-btn"
            onClick={() => {
              setEditing(null)
              setPanel('import')
            }}
            disabled={loading}
          >
            Import CSV
          </button>
          <button
            type="button"
            className="page__primary-btn"
            onClick={() => {
              setEditing(createEmptySubscriber())
              setPanel('form')
            }}
            disabled={loading}
          >
            Add subscriber
          </button>
        </div>
      </header>

      {panel === 'form' ? (
        <SubscriberForm
          key={editing?.id || 'new-subscriber'}
          initialSubscriber={editing}
          title={editing?.name ? 'Edit subscriber' : 'Add subscriber'}
          saving={saving}
          onSave={handleSave}
          onCancel={() => {
            setPanel(null)
            setEditing(null)
          }}
        />
      ) : null}

      {panel === 'import' ? (
        <SubscriberImport
          subscribers={subscribers}
          saving={saving}
          onImport={importValidRows}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      <div className="subscribers__toolbar">
        <label htmlFor="subscriber-search" className="subscribers__search-label">
          Search subscribers
        </label>
        <input
          id="subscriber-search"
          type="search"
          className="subscribers__search"
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p className="page__status" role="status">
          Loading subscribers…
        </p>
      ) : null}

      {error || actionError ? (
        <p className="page__error" role="alert">
          {error || actionError}
        </p>
      ) : null}

      <p className="page__count" aria-live="polite">
        Showing <strong>{filtered.length}</strong> of {subscribers.length}{' '}
        subscriber{subscribers.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 && !loading ? (
        <div className="subscribers__empty" role="status">
          <p className="subscribers__empty-title">No subscribers found</p>
          <p className="subscribers__empty-text">
            Add a test subscriber or import a CSV with name and email columns.
          </p>
        </div>
      ) : (
        <div className="subscribers__table-wrap">
          <table className="subscribers__table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Status</th>
                <th scope="col">Date added</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((subscriber) => (
                <tr key={subscriber.id}>
                  <th scope="row">
                    <span className="subscribers__name">{subscriber.name}</span>
                    {subscriber.isTestData ? (
                      <span className="subscribers__badge">
                        {subscriber.source === 'import'
                          ? 'Imported test data'
                          : 'Test data'}
                      </span>
                    ) : null}
                  </th>
                  <td>{subscriber.email}</td>
                  <td>
                    <span
                      className={`subscribers__status subscribers__status--${subscriber.status.toLowerCase()}`}
                    >
                      {subscriber.status}
                    </span>
                  </td>
                  <td>
                    <time dateTime={subscriber.dateAdded}>
                      {dateFormatter.format(new Date(subscriber.dateAdded))}
                    </time>
                  </td>
                  <td className="subscribers__actions">
                    <button
                      type="button"
                      className="subscribers__action"
                      onClick={() => {
                        setEditing(subscriber)
                        setPanel('form')
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="subscribers__action subscribers__action--danger"
                      onClick={() => setPendingDelete(subscriber)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete subscriber?"
          message={`“${pendingDelete.name}” (${pendingDelete.email}) will be removed from your account.`}
          confirmLabel="Delete subscriber"
          cancelLabel="Keep subscriber"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </section>
  )
}

export default Subscribers
