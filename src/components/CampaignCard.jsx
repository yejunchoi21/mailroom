import { isDemoCampaign, isEditableCampaign } from '../data/sampleCampaigns.js'
import './CampaignCard.css'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatUpdatedAt(isoDate) {
  return dateFormatter.format(new Date(isoDate))
}

function CampaignCard({ campaign, onEdit, onView, onDelete }) {
  const statusClass = `campaign-status campaign-status--${campaign.status.toLowerCase()}`
  const isDemo = isDemoCampaign(campaign)
  const canEdit = isEditableCampaign(campaign)
  const isReadOnlyDemo =
    isDemo && (campaign.status === 'Scheduled' || campaign.status === 'Sent')

  return (
    <tr className="campaign-row">
      <th scope="row" className="campaign-row__name">
        <span className="campaign-row__name-text">{campaign.name}</span>
        {isDemo ? (
          <span className="campaign-row__badge">Demo</span>
        ) : (
          <span className="campaign-row__badge campaign-row__badge--yours">
            Your draft
          </span>
        )}
      </th>
      <td className="campaign-row__id">{campaign.id}</td>
      <td className="campaign-row__subject">{campaign.subject || '—'}</td>
      <td className="campaign-row__status">
        <span className={statusClass}>{campaign.status}</span>
        {isReadOnlyDemo ? (
          <span className="campaign-row__readonly">Read-only</span>
        ) : null}
      </td>
      <td className="campaign-row__updated">
        <time dateTime={campaign.updatedAt}>
          {formatUpdatedAt(campaign.updatedAt)}
        </time>
      </td>
      <td className="campaign-row__actions">
        {canEdit ? (
          <>
            <button
              type="button"
              className="campaign-row__action"
              onClick={() => onEdit?.(campaign)}
            >
              Edit
            </button>
            <button
              type="button"
              className="campaign-row__action campaign-row__action--danger"
              onClick={() => onDelete?.(campaign)}
            >
              Delete
            </button>
          </>
        ) : (
          <button
            type="button"
            className="campaign-row__action"
            onClick={() => onView?.(campaign)}
          >
            View
          </button>
        )}
      </td>
    </tr>
  )
}

export default CampaignCard
