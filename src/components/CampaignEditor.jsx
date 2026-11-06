import { useId, useState } from 'react'
import MessageEditor from './MessageEditor.jsx'
import CampaignPreviewPane from './CampaignPreviewPane.jsx'
import CampaignDeliveryPanel from './CampaignDeliveryPanel.jsx'
import './CampaignEditor.css'

function CampaignEditor({
  initialCampaign,
  readOnly = false,
  saving = false,
  onSave,
  onCancel,
}) {
  const nameId = useId()
  const subjectId = useId()
  const bodyId = useId()
  const nameErrorId = useId()
  const formStatusId = useId()

  const [name, setName] = useState(initialCampaign?.name || '')
  const [subject, setSubject] = useState(initialCampaign?.subject || '')
  const [body, setBody] = useState(initialCampaign?.body || '')
  const [previewViewport, setPreviewViewport] = useState('desktop')
  const [nameError, setNameError] = useState('')
  const [formMessage, setFormMessage] = useState('')

  const isDemo = initialCampaign?.source === 'demo' || initialCampaign?.isDemo
  const title = readOnly
    ? isDemo
      ? 'View demo campaign'
      : 'View campaign'
    : initialCampaign?.id && initialCampaign?.name
      ? 'Edit draft'
      : 'New campaign'

  async function handleSubmit(event) {
    event.preventDefault()
    if (readOnly || saving) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Enter a campaign name to save this draft.')
      setFormMessage('')
      return
    }

    setNameError('')
    setFormMessage('Saving…')
    const result = await onSave({
      id: initialCampaign?.id,
      name: trimmedName,
      subject,
      body,
      createdAt: initialCampaign?.createdAt,
      status: 'Draft',
      source: 'user',
    })

    if (result?.error) {
      setNameError(result.error)
      setFormMessage('')
      return
    }

    setFormMessage('Draft saved.')
  }

  return (
    <section className="campaign-editor" aria-labelledby="campaign-editor-heading">
      <header className="campaign-editor__header">
        <div>
          <h1 id="campaign-editor-heading" className="campaign-editor__title">
            {title}
          </h1>
          <p className="campaign-editor__subtitle">
            {readOnly
              ? isDemo
                ? 'Demo campaigns are sample content and cannot be edited.'
                : 'This campaign is read-only.'
              : 'Unfinished drafts are fine — only the campaign name is required.'}
          </p>
        </div>
        <button
          type="button"
          className="campaign-editor__ghost-btn"
          onClick={onCancel}
        >
          Back to campaigns
        </button>
      </header>

      {isDemo ? (
        <p className="campaign-editor__demo-note" role="note">
          Demo data — not saved to your drafts.
        </p>
      ) : null}

      <form className="campaign-editor__form" onSubmit={handleSubmit} noValidate>
        <div className="campaign-editor__fields">
          <div className="campaign-editor__field">
            <label htmlFor={nameId} className="campaign-editor__label">
              Campaign name <span className="campaign-editor__required">(required)</span>
            </label>
            <input
              id={nameId}
              type="text"
              className={`campaign-editor__input${nameError ? ' is-invalid' : ''}`}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (nameError) setNameError('')
              }}
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? nameErrorId : undefined}
              disabled={readOnly}
              autoComplete="off"
              required
            />
            {nameError ? (
              <p id={nameErrorId} className="campaign-editor__error" role="alert">
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="campaign-editor__field">
            <label htmlFor={subjectId} className="campaign-editor__label">
              Email subject
            </label>
            <input
              id={subjectId}
              type="text"
              className="campaign-editor__input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={readOnly}
              autoComplete="off"
              placeholder="Optional until you send"
            />
          </div>

          <div className="campaign-editor__field">
            <p id={bodyId} className="campaign-editor__label">
              Message body
            </p>
            <MessageEditor
              value={body}
              onChange={setBody}
              readOnly={readOnly}
              labelledBy={bodyId}
            />
          </div>
        </div>

        <aside className="campaign-editor__preview" aria-labelledby="preview-heading">
          <div className="campaign-editor__preview-header">
            <h2 id="preview-heading" className="campaign-editor__preview-title">
              Live preview
            </h2>
            <div
              className="campaign-editor__viewport-toggle"
              role="group"
              aria-label="Preview width"
            >
              <button
                type="button"
                className={`campaign-editor__viewport-btn${previewViewport === 'desktop' ? ' is-selected' : ''}`}
                aria-pressed={previewViewport === 'desktop'}
                onClick={() => setPreviewViewport('desktop')}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`campaign-editor__viewport-btn${previewViewport === 'mobile' ? ' is-selected' : ''}`}
                aria-pressed={previewViewport === 'mobile'}
                onClick={() => setPreviewViewport('mobile')}
              >
                Mobile
              </button>
            </div>
          </div>

          <CampaignPreviewPane
            subject={subject}
            bodyHtml={body}
            viewport={previewViewport}
          />
        </aside>

        <div className="campaign-editor__actions">
          <p id={formStatusId} className="campaign-editor__status" aria-live="polite">
            {formMessage}
          </p>
          <div className="campaign-editor__action-buttons">
            <button
              type="button"
              className="campaign-editor__ghost-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            {!readOnly ? (
              <button
                type="submit"
                className="campaign-editor__primary-btn"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {!isDemo ? (
        <CampaignDeliveryPanel
          campaign={{
            id: initialCampaign?.id,
            name: initialCampaign?.name || name,
            subject: initialCampaign?.subject || subject,
          }}
        />
      ) : null}
    </section>
  )
}

export default CampaignEditor
