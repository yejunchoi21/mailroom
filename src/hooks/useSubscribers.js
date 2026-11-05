import { useEffect, useState } from 'react'
import {
  SUBSCRIBERS_STORAGE_KEY,
  applyImportRows,
  createEmptySubscriber,
  deleteSubscriber,
  loadSubscribers,
  upsertSubscriber,
} from '../utils/subscriberStorage.js'

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState(() => loadSubscribers())

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === SUBSCRIBERS_STORAGE_KEY) {
        setSubscribers(loadSubscribers())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function saveSubscriber(input) {
    const result = upsertSubscriber(subscribers, input)
    if (!result.error) {
      setSubscribers(result.subscribers)
    }
    return result
  }

  function removeSubscriber(subscriberId) {
    const next = deleteSubscriber(subscribers, subscriberId)
    setSubscribers(next)
    return next
  }

  function importValidRows(validRows) {
    const result = applyImportRows(subscribers, validRows)
    setSubscribers(result.subscribers)
    return result
  }

  return {
    subscribers,
    saveSubscriber,
    removeSubscriber,
    importValidRows,
    createEmptySubscriber,
  }
}
