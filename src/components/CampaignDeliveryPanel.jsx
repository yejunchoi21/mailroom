import { useEffect, useState } from 'react'
import { apiRequest, isServerId } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import './CampaignDeliveryPanel.css'

const TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
]

function CampaignDeliveryPanel({ campaign }) {
  const { user } = useAuth()
  const saved = isServerId(campaign?.id)

  const [sendState, setSendState] = useState('idle')
  const [sendMessage, setSendMessage] = useState('')
  const [scheduleState, setScheduleState] = useState('idle')
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [schedules, setSchedules] = useState([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)

  const defaultZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [timezone, setTimezone] = useState(
    TIME_ZONES.includes(defaultZone) ? defaultZone : 'America/New_York',
  )

  async function refreshSchedules() {
    if (!saved) return
    setLoadingSchedules(true)
    try {
      const data = await apiRequest('/schedules')
      const mine = (data.schedules || []).filter(
        (item) => item.campaignId === campaign.id,
      )
      setSchedules(mine)
    } catch (error) {
      setScheduleMessage(error.message || 'Could not load schedules.')
    } finally {
      setLoadingSchedules(false)
    }
  }

  useEffect(() => {
    if (!saved) return undefined
    let active = true
    const timer = window.setTimeout(() => {
      if (active) void refreshSchedules()
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when campaign id changes
  }, [campaign?.id, saved])

  if (!saved) {
    return (
      <section className="delivery-panel" aria-label="Delivery">
        <p className="delivery-panel__note">
          Save this draft first to send a test email or schedule a preview to
          your account address.
        </p>
      </section>
    )
  }

  async function handleSendTest() {
    setSendState('sending')
    setSendMessage('')
    try {
      const data = await apiRequest(`/campaigns/${campaign.id}/send-test`, {
        method: 'POST',
      })
      setSendState('submitted')
      setSendMessage(
        `Submitted to ${data.recipient}. ${data.notice}`,
      )
    } catch (error) {
      setSendState('error')
      setSendMessage(error.message || 'Could not send test email.')
    }
  }

  async function handleSchedule(event) {
    event.preventDefault()
    setScheduleState('saving')
    setScheduleMessage('')
    try {
      const data = await apiRequest(`/campaigns/${campaign.id}/schedule`, {
        method: 'POST',
        body: { date, time, timezone },
      })
      setScheduleState('scheduled')
      setScheduleMessage(data.notice || 'Scheduled.')
      await refreshSchedules()
    } catch (error) {
      setScheduleState('error')
      setScheduleMessage(error.message || 'Could not schedule send.')
    }
  }

  async function handleCancel(scheduleId) {
    setScheduleMessage('')
    try {
      await apiRequest(`/schedules/${scheduleId}/cancel`, { method: 'POST' })
      setScheduleMessage('Schedule cancelled.')
      await refreshSchedules()
    } catch (error) {
      setScheduleMessage(error.message || 'Could not cancel schedule.')
    }
  }

  return (
    <section className="delivery-panel" aria-labelledby="delivery-heading">
      <h2 id="delivery-heading" className="delivery-panel__title">
        Test &amp; schedule
      </h2>
      <p className="delivery-panel__note" role="note">
        Learning milestone: delivery goes only to your signed-in email (
        <strong>{user?.email}</strong>), not the full subscriber list. Resend
        must have a verified sender domain; with an unverified account you can
        usually only email yourself. Provider acceptance is not confirmed
        delivery.
      </p>

      <div className="delivery-panel__card">
        <h3 className="delivery-panel__subtitle">Send test now</h3>
        <button
          type="button"
          className="delivery-panel__primary"
          onClick={handleSendTest}
          disabled={sendState === 'sending'}
        >
          {sendState === 'sending' ? 'Sending…' : 'Send test to my email'}
        </button>
        {sendMessage ? (
          <p
            className={`delivery-panel__status delivery-panel__status--${sendState}`}
            role="status"
          >
            {sendMessage}
          </p>
        ) : null}
      </div>

      <form className="delivery-panel__card" onSubmit={handleSchedule}>
        <h3 className="delivery-panel__subtitle">Schedule owner preview</h3>
        <div className="delivery-panel__grid">
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </label>
          <label>
            Time zone
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              required
            >
              {TIME_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="delivery-panel__primary"
          disabled={scheduleState === 'saving'}
        >
          {scheduleState === 'saving' ? 'Scheduling…' : 'Schedule send'}
        </button>
        {scheduleMessage ? (
          <p
            className={`delivery-panel__status delivery-panel__status--${scheduleState === 'error' ? 'error' : 'submitted'}`}
            role="status"
          >
            {scheduleMessage}
          </p>
        ) : null}
      </form>

      <div className="delivery-panel__card">
        <h3 className="delivery-panel__subtitle">Schedules for this campaign</h3>
        {loadingSchedules ? <p className="delivery-panel__note">Loading…</p> : null}
        {schedules.length === 0 && !loadingSchedules ? (
          <p className="delivery-panel__note">No schedules yet.</p>
        ) : (
          <ul className="delivery-panel__list">
            {schedules.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.status}</strong> ·{' '}
                  {new Date(item.scheduledFor).toLocaleString()} ({item.timezone})
                  {item.error ? ` · ${item.error}` : ''}
                </div>
                {item.status === 'Scheduled' ? (
                  <button
                    type="button"
                    className="delivery-panel__ghost"
                    onClick={() => handleCancel(item.id)}
                  >
                    Cancel
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default CampaignDeliveryPanel
