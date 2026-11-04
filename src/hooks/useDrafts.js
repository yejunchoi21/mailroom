import { useEffect, useState } from 'react'
import {
  createEmptyDraft,
  deleteDraft,
  loadDrafts,
  upsertDraft,
} from '../utils/draftStorage.js'

export function useDrafts() {
  const [drafts, setDrafts] = useState(() => loadDrafts())

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === 'mailroom.drafts.v1') {
        setDrafts(loadDrafts())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function saveDraft(draftInput) {
    const result = upsertDraft(drafts, draftInput)
    if (!result.error) {
      setDrafts(result.drafts)
    }
    return result
  }

  function removeDraft(draftId) {
    const next = deleteDraft(drafts, draftId)
    setDrafts(next)
    return next
  }

  return {
    drafts,
    saveDraft,
    removeDraft,
    createEmptyDraft,
  }
}
