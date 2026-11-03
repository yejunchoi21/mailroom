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
    <div className="campaign-table-wrap">
      <table className="campaign-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">ID</th>
            <th scope="col">Subject</th>
            <th scope="col">Status</th>
            <th scope="col">Last updated</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CampaignList
