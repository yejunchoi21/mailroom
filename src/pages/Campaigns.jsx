import { useState } from 'react'
import { sampleCampaigns } from '../data/sampleCampaigns.js'
import { useDrafts } from '../hooks/useDrafts.js'
import CampaignPreviews from '../components/CampaignPreviews.jsx'
import CampaignFilters from '../components/CampaignFilters.jsx'
import CampaignList from '../components/CampaignList.jsx'
import CampaignEditor from '../components/CampaignEditor.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function matchesSearch(campaign, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    campaign.name.toLowerCase().includes(normalized) ||
    (campaign.subject || '').toLowerCase().includes(normalized)
  )
}

function matchesStatus(campaign, statusFilter) {
  return statusFilter === 'All' || campaign.status === statusFilter
}

function sortByUpdatedDesc(a, b) {
  return new Date(b.updatedAt) - new Date(a.updatedAt)
}

function Campaigns() {
  const { drafts, saveDraft, removeDraft, createEmptyDraft } = useDrafts()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editorState, setEditorState] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const allCampaigns = [...drafts, ...sampleCampaigns].sort(sortByUpdatedDesc)
  const previewCampaigns = [...sampleCampaigns].sort(sortByUpdatedDesc)

  const filteredCampaigns = allCampaigns
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

  function openNewCampaign() {
    setEditorState({
      campaign: createEmptyDraft(),
      readOnly: false,
    })
  }

  function openEdit(campaign) {
    setEditorState({ campaign, readOnly: false })
  }

  function openView(campaign) {
    setEditorState({ campaign, readOnly: true })
  }

  function closeEditor() {
    setEditorState(null)
  }

  function handleSave(draftInput) {
    const result = saveDraft(draftInput)
    if (!result.error) {
      setEditorState(null)
    }
    return result
  }

  function confirmDelete() {
    if (!pendingDelete) return
    removeDraft(pendingDelete.id)
    setPendingDelete(null)
  }

  const matchCount = filteredCampaigns.length
  const matchLabel =
    matchCount === 1 ? '1 campaign' : `${matchCount} campaigns`

  if (editorState) {
    return (
      <div className="page page--wide">
        <CampaignEditor
          key={editorState.campaign.id || 'new-campaign'}
          initialCampaign={editorState.campaign}
          readOnly={editorState.readOnly}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      </div>
    )
  }

  return (
    <section className="page page--wide" aria-labelledby="campaigns-heading">
      <header className="page__header page__header--with-action">
        <div>
          <h1 id="campaigns-heading" className="page__heading">
            Campaigns
          </h1>
          <p className="page__demo-banner" role="note">
            Demo campaigns are sample content. Your drafts are saved in this
            browser and stay separate from demos.
          </p>
        </div>
        <button
          type="button"
          className="page__primary-btn"
          onClick={openNewCampaign}
        >
          New campaign
        </button>
      </header>

      <CampaignPreviews campaigns={previewCampaigns} />

      <div className="page__browse">
        <h2 className="page__browse-heading">Browse campaigns</h2>
        <p className="page__browse-copy">
          Search and filter your drafts and demo campaigns. Scheduled and Sent
          demos are read-only.
        </p>
      </div>

      <CampaignFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <p className="page__count" aria-live="polite">
        Showing <strong>{matchLabel}</strong>
        {drafts.length > 0
          ? ` · ${drafts.length} saved draft${drafts.length === 1 ? '' : 's'}`
          : ''}
      </p>

      <CampaignList
        campaigns={filteredCampaigns}
        onClearFilters={clearFilters}
        onEdit={openEdit}
        onView={openView}
        onDelete={setPendingDelete}
      />

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete draft?"
          message={`“${pendingDelete.name}” will be permanently removed from this browser. This cannot be undone.`}
          confirmLabel="Delete draft"
          cancelLabel="Keep draft"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </section>
  )
}

export default Campaigns
