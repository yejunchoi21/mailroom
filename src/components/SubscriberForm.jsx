import { useId, useState } from 'react'
import { SUBSCRIBER_STATUSES } from '../utils/subscriberStorage.js'
import './SubscriberForm.css'

function SubscriberForm({
  initialSubscriber,
  onSave,
  onCancel,
  saving = false,
  title = 'Add subscriber',
}) {
  const nameId = useId()
  const emailId = useId()
  const statusId = useId()
  const errorId = useId()

  const [name, setName] = useState(initialSubscriber?.name || '')
  const [email, setEmail] = useState(initialSubscriber?.email || '')
  const [status, setStatus] = useState(initialSubscriber?.status || 'Subscribed')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    setError('')

    const result = await onSave({
      id: initialSubscriber?.id,
      name,
      email,
      status,
      dateAdded: initialSubscriber?.dateAdded,
      source: initialSubscriber?.source || 'manual',
      isTestData: true,
    })

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <section className="subscriber-form" aria-labelledby="subscriber-form-heading">
      <header className="subscriber-form__header">
        <h2 id="subscriber-form-heading" className="subscriber-form__title">
          {title}
        </h2>
        <p className="subscriber-form__note" role="note">
          Manually added subscribers are labeled as test data for now.
        </p>
      </header>

      <form className="subscriber-form__body" onSubmit={handleSubmit} noValidate>
        <div className="subscriber-form__field">
          <label htmlFor={nameId} className="subscriber-form__label">
            Name
          </label>
          <input
            id={nameId}
            type="text"
            className="subscriber-form__input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="subscriber-form__field">
          <label htmlFor={emailId} className="subscriber-form__label">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            className="subscriber-form__input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div className="subscriber-form__field">
          <label htmlFor={statusId} className="subscriber-form__label">
            Subscription status
          </label>
          <select
            id={statusId}
            className="subscriber-form__input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {SUBSCRIBER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p id={errorId} className="subscriber-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="subscriber-form__actions">
          <button
            type="button"
            className="subscriber-form__ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="subscriber-form__primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save subscriber'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default SubscriberForm
