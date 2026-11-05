import { DRAFTS_STORAGE_KEY, loadDrafts } from './draftStorage.js'
import {
  SUBSCRIBERS_STORAGE_KEY,
  loadSubscribers,
} from './subscriberStorage.js'

export function readLocalBackup() {
  return {
    drafts: loadDrafts(),
    subscribers: loadSubscribers(),
    keys: {
      drafts: DRAFTS_STORAGE_KEY,
      subscribers: SUBSCRIBERS_STORAGE_KEY,
    },
  }
}

export function hasLocalBackup() {
  const backup = readLocalBackup()
  return backup.drafts.length > 0 || backup.subscribers.length > 0
}
