import { sanitizeHtml } from '../utils/sanitizeHtml.js'
import './CampaignPreviewPane.css'

function CampaignPreviewPane({ subject, bodyHtml, viewport = 'desktop' }) {
  const safeHtml = sanitizeHtml(bodyHtml || '')
  const displaySubject = subject?.trim() || '(No subject)'

  return (
    <div className="campaign-preview-pane">
      <div
        className={`campaign-preview-pane__frame campaign-preview-pane__frame--${viewport}`}
        aria-live="polite"
      >
        <div className="campaign-preview-pane__email">
          <p className="campaign-preview-pane__subject-label">Subject</p>
          <p className="campaign-preview-pane__subject">{displaySubject}</p>
          <div
            className="campaign-preview-pane__body"
            dangerouslySetInnerHTML={{ __html: safeHtml || '<p><em>No message yet.</em></p>' }}
          />
        </div>
      </div>
    </div>
  )
}

export default CampaignPreviewPane
