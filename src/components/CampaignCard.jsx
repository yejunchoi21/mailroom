import './CampaignCard.css'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatUpdatedAt(isoDate) {
  return dateFormatter.format(new Date(isoDate))
}

function CampaignCard({ campaign }) {
  const statusClass = `campaign-card__status campaign-card__status--${campaign.status.toLowerCase()}`

  return (
    <article className="campaign-card" aria-labelledby={`campaign-${campaign.id}-name`}>
      <div className="campaign-card__header">
        <h2 id={`campaign-${campaign.id}-name`} className="campaign-card__name">
          {campaign.name}
        </h2>
        <span className={statusClass}>{campaign.status}</span>
      </div>

      <dl className="campaign-card__meta">
        <div className="campaign-card__row">
          <dt>ID</dt>
          <dd>{campaign.id}</dd>
        </div>
        <div className="campaign-card__row">
          <dt>Subject</dt>
          <dd>{campaign.subject}</dd>
        </div>
        <div className="campaign-card__row">
          <dt>Last updated</dt>
          <dd>
            <time dateTime={campaign.updatedAt}>
              {formatUpdatedAt(campaign.updatedAt)}
            </time>
          </dd>
        </div>
      </dl>
    </article>
  )
}

export default CampaignCard
