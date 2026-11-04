import CampaignCard from './CampaignCard.jsx'
import './CampaignList.css'

function CampaignList({
  campaigns,
  onClearFilters,
  onEdit,
  onView,
  onDelete,
}) {
  if (campaigns.length === 0) {
    return (
      <div className="campaign-list__empty" role="status">
        <p className="campaign-list__empty-title">No campaigns match</p>
        <p className="campaign-list__empty-text">
          Try a different search term or status, or clear your filters to see
          campaigns again.
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
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CampaignList
