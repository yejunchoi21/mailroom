import { useEffect, useState } from 'react'
import { apiRequest, isServerId } from '../api/client.js'
import { createEmptySubscriber } from '../utils/subscriberStorage.js'
import { useAuth } from '../auth/useAuth.js'

export function useSubscribers() {
  const { user } = useAuth()
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!user) {
        setSubscribers([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const data = await apiRequest('/subscribers')
        if (active) setSubscribers(data.subscribers || [])
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load subscribers.')
          setSubscribers([])
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

  async function saveSubscriber(input) {
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: input.name,
        email: input.email,
        status: input.status,
        dateAdded: input.dateAdded,
        source: input.source,
        isTestData: input.isTestData,
        localId: isServerId(input.id) ? undefined : input.id,
      }

      const data = isServerId(input.id)
        ? await apiRequest(`/subscribers/${input.id}`, {
            method: 'PUT',
            body: payload,
          })
        : await apiRequest('/subscribers', {
            method: 'POST',
            body: payload,
          })

      setSubscribers((current) => {
        const next = current.filter(
          (subscriber) => subscriber.id !== data.subscriber.id,
        )
        return [data.subscriber, ...next]
      })

      return { subscriber: data.subscriber, error: null }
    } catch (err) {
      const message = err.message || 'Could not save subscriber.'
      setError(message)
      return { subscriber: null, error: message }
    } finally {
      setSaving(false)
    }
  }

  async function removeSubscriber(subscriberId) {
    setSaving(true)
    setError('')
    try {
      await apiRequest(`/subscribers/${subscriberId}`, { method: 'DELETE' })
      setSubscribers((current) =>
        current.filter((subscriber) => subscriber.id !== subscriberId),
      )
      return { error: null }
    } catch (err) {
      const message = err.message || 'Could not delete subscriber.'
      setError(message)
      return { error: message }
    } finally {
      setSaving(false)
    }
  }

  async function importValidRows(validRows) {
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest('/subscribers/import', {
        method: 'POST',
        body: { rows: validRows },
      })

      const data = await apiRequest('/subscribers')
      setSubscribers(data.subscribers || [])
      return result
    } catch (err) {
      const message = err.message || 'Could not import subscribers.'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  function clearSubscribers() {
    setSubscribers([])
    setError('')
    setLoading(false)
  }

  return {
    subscribers,
    loading,
    saving,
    error,
    saveSubscriber,
    removeSubscriber,
    importValidRows,
    createEmptySubscriber,
    clearSubscribers,
    setSubscribers,
  }
}
