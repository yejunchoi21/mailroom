import { useState } from 'react'
import { sampleCampaigns } from '../data/sampleCampaigns.js'
import CampaignFilters from '../components/CampaignFilters.jsx'
import CampaignList from '../components/CampaignList.jsx'

function matchesSearch(campaign, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    campaign.name.toLowerCase().includes(normalized) ||
    campaign.subject.toLowerCase().includes(normalized)
  )
}

function matchesStatus(campaign, statusFilter) {
  return statusFilter === 'All' || campaign.status === statusFilter
}

function sortByUpdatedDesc(a, b) {
  return new Date(b.updatedAt) - new Date(a.updatedAt)
}

function Campaigns() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredCampaigns = sampleCampaigns
    .filter(
      (campaign) =>
        matchesSearch(campaign, searchQuery) &&
        matchesStatus(campaign, statusFilter),
    )
    .sort(sortByUpdatedDesc)

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('All')
  }

  const matchCount = filteredCampaigns.length
  const matchLabel =
    matchCount === 1 ? '1 campaign' : `${matchCount} campaigns`

  return (
    <section className="page page--wide" aria-labelledby="campaigns-heading">
      <header className="page__header">
        <h1 id="campaigns-heading" className="page__heading">
          Campaigns
        </h1>
        <p className="page__demo-banner" role="note">
          Demo data — these sample campaigns are for browsing only and are not
          saved.
        </p>
      </header>

      <CampaignFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <p className="page__count" aria-live="polite">
        Showing <strong>{matchLabel}</strong>
      </p>

      <CampaignList
        campaigns={filteredCampaigns}
        onClearFilters={clearFilters}
      />
    </section>
  )
}

export default Campaigns
