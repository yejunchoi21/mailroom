import { CAMPAIGN_STATUSES } from '../data/sampleCampaigns.js'
import './CampaignFilters.css'

const STATUS_OPTIONS = ['All', ...CAMPAIGN_STATUSES]

function CampaignFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <div className="campaign-filters">
      <div className="campaign-filters__field campaign-filters__field--search">
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

      <div className="campaign-filters__field campaign-filters__field--status">
        <p id="campaign-status-label" className="campaign-filters__label">
          Status
        </p>
        <div
          className="campaign-filters__pills"
          role="group"
          aria-labelledby="campaign-status-label"
        >
          {STATUS_OPTIONS.map((status) => {
            const isSelected = statusFilter === status

            return (
              <button
                key={status}
                type="button"
                className={`campaign-filters__pill${isSelected ? ' campaign-filters__pill--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => onStatusChange(status)}
              >
                {status}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CampaignFilters
