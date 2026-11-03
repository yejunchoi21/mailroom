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
  const statusClass = `campaign-status campaign-status--${campaign.status.toLowerCase()}`

  return (
    <tr className="campaign-row">
      <th scope="row" className="campaign-row__name">
        {campaign.name}
      </th>
      <td className="campaign-row__id">{campaign.id}</td>
      <td className="campaign-row__subject">{campaign.subject}</td>
      <td className="campaign-row__status">
        <span className={statusClass}>{campaign.status}</span>
      </td>
      <td className="campaign-row__updated">
        <time dateTime={campaign.updatedAt}>
          {formatUpdatedAt(campaign.updatedAt)}
        </time>
      </td>
    </tr>
  )
}

export default CampaignCard
