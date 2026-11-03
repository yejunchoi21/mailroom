import { CAMPAIGN_STATUSES } from '../data/sampleCampaigns.js'
import './CampaignFilters.css'

function CampaignFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <div className="campaign-filters">
      <div className="campaign-filters__field">
        <label htmlFor="campaign-search" className="campaign-filters__label">
          Search campaigns
        </label>
        <input
          id="campaign-search"
          type="search"
          className="campaign-filters__input"
          placeholder="Search by name or subject"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="campaign-filters__field">
        <label htmlFor="campaign-status" className="campaign-filters__label">
          Status
        </label>
        <select
          id="campaign-status"
          className="campaign-filters__select"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="All">All</option>
          {CAMPAIGN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default CampaignFilters
