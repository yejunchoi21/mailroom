import { useEffect, useState } from 'react'
import { apiRequest, isServerId } from '../api/client.js'
import { createEmptyDraft } from '../utils/draftStorage.js'
import { useAuth } from '../auth/useAuth.js'

export function useDrafts() {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!user) {
        setDrafts([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const data = await apiRequest('/campaigns')
        if (active) setDrafts(data.campaigns || [])
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load campaigns.')
          setDrafts([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  async function saveDraft(draftInput) {
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: draftInput.name,
        subject: draftInput.subject,
        body: draftInput.body,
        createdAt: draftInput.createdAt,
        localId: isServerId(draftInput.id) ? undefined : draftInput.id,
      }

      const data = isServerId(draftInput.id)
        ? await apiRequest(`/campaigns/${draftInput.id}`, {
            method: 'PUT',
            body: payload,
          })
        : await apiRequest('/campaigns', {
            method: 'POST',
            body: payload,
          })

      setDrafts((current) => {
        const next = current.filter((draft) => draft.id !== data.campaign.id)
        return [data.campaign, ...next]
      })

      return { draft: data.campaign, error: null }
    } catch (err) {
      setError(err.message || 'Could not save draft.')
      return { draft: null, error: err.message || 'Could not save draft.' }
    } finally {
      setSaving(false)
    }
  }

  async function removeDraft(draftId) {
    setSaving(true)
    setError('')
    try {
      await apiRequest(`/campaigns/${draftId}`, { method: 'DELETE' })
      setDrafts((current) => current.filter((draft) => draft.id !== draftId))
      return { error: null }
    } catch (err) {
      const message = err.message || 'Could not delete draft.'
      setError(message)
      return { error: message }
    } finally {
      setSaving(false)
    }
  }

  function clearDrafts() {
    setDrafts([])
    setError('')
    setLoading(false)
  }

  return {
    drafts,
    loading,
    saving,
    error,
    saveDraft,
    removeDraft,
    createEmptyDraft,
    clearDrafts,
    setDrafts,
  }
}
