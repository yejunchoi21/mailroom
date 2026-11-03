import CampaignCard from './CampaignCard.jsx'
import './CampaignList.css'

function CampaignList({ campaigns, onClearFilters }) {
  if (campaigns.length === 0) {
    return (
      <div className="campaign-list__empty" role="status">
        <p className="campaign-list__empty-title">No campaigns match</p>
        <p className="campaign-list__empty-text">
          Try a different search term or status, or clear your filters to see
          all demo campaigns again.
        </p>
        <button
          type="button"
          className="campaign-list__clear"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <ul className="campaign-list">
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <CampaignCard campaign={campaign} />
        </li>
      ))}
    </ul>
  )
}

export default CampaignList
