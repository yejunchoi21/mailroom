import { useState } from 'react'
import { apiRequest } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { hasLocalBackup, readLocalBackup } from '../utils/localBackup.js'
import './Settings.css'

function Settings() {
  const { user, logout } = useAuth()
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const backup = readLocalBackup()
  const backupAvailable = hasLocalBackup()

  async function handleImportBackup() {
    setImporting(true)
    setError('')
    setMessage('')
    setReport(null)

    try {
      const data = await apiRequest('/import/local-backup', {
        method: 'POST',
        body: {
          drafts: backup.drafts,
          subscribers: backup.subscribers,
        },
      })
      setReport(data.report)
      setMessage(
        'Import finished. Browser localStorage backup was left in place and is not the live store.',
      )
    } catch (err) {
      setError(err.message || 'Could not import local backup.')
    } finally {
      setImporting(false)
    }
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <section className="page page--wide" aria-labelledby="settings-heading">
      <header className="page__header">
        <h1 id="settings-heading" className="page__heading">
          Settings
        </h1>
        <p className="page__message">
          Signed in as <strong>{user?.email}</strong>. Account data is stored in
          MongoDB. Browser localStorage is kept only as an optional backup
          import source.
        </p>
      </header>

      <section className="settings-card" aria-labelledby="backup-heading">
        <h2 id="backup-heading" className="settings-card__title">
          Import local backup
        </h2>
        <p className="settings-card__copy">
          Explicitly import drafts and subscribers still sitting in this
          browser. Duplicate imports are skipped, invalid records are reported,
          and unsubscribed addresses are never auto-resubscribed.
        </p>

        <p className="settings-card__meta">
          Found {backup.drafts.length} local draft
          {backup.drafts.length === 1 ? '' : 's'} and{' '}
          {backup.subscribers.length} local subscriber
          {backup.subscribers.length === 1 ? '' : 's'}.
        </p>

        <button
          type="button"
          className="page__primary-btn"
          onClick={handleImportBackup}
          disabled={!backupAvailable || importing}
        >
          {importing ? 'Importing…' : 'Import browser backup into account'}
        </button>

        {message ? (
          <p className="settings-card__success" role="status">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="settings-card__error" role="alert">
            {error}
          </p>
        ) : null}

        {report ? (
          <div className="settings-card__report">
            <h3>Import report</h3>
            <ul>
              <li>
                Campaigns imported: {report.campaigns.imported}; already
                imported: {report.campaigns.skippedAlreadyImported}; invalid:{' '}
                {report.campaigns.invalid.length}
              </li>
              <li>
                Subscribers imported: {report.subscribers.imported}; already
                imported: {report.subscribers.skippedAlreadyImported};
                duplicates: {report.subscribers.skippedDuplicates};
                unsubscribed left unchanged:{' '}
                {report.subscribers.skippedUnsubscribed}; invalid:{' '}
                {report.subscribers.invalid.length}
              </li>
            </ul>

            {report.campaigns.invalid.length > 0 ||
            report.subscribers.invalid.length > 0 ? (
              <details>
                <summary>Show invalid records</summary>
                <pre>
                  {JSON.stringify(
                    {
                      campaigns: report.campaigns.invalid,
                      subscribers: report.subscribers.invalid,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="settings-card" aria-labelledby="account-heading">
        <h2 id="account-heading" className="settings-card__title">
          Account
        </h2>
        <p className="settings-card__copy">
          Logging out clears account data from this browser session. Live records
          remain in your Mailroom database.
        </p>
        <button
          type="button"
          className="page__secondary-btn"
          onClick={handleLogout}
        >
          Log out
        </button>
      </section>
    </section>
  )
}

export default Settings
