import { useEffect, useRef, useState } from 'react'
import './CampaignPreviews.css'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function CampaignPreviews({ campaigns }) {
  const trackRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  function updateScrollState() {
    const track = trackRef.current
    if (!track) return

    const maxScrollLeft = track.scrollWidth - track.clientWidth
    setCanScrollPrev(track.scrollLeft > 2)
    setCanScrollNext(track.scrollLeft < maxScrollLeft - 2)
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    updateScrollState()

    track.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(track)

    return () => {
      track.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      observer.disconnect()
    }
  }, [campaigns])

  function getScrollAmount() {
    const track = trackRef.current
    if (!track) return 0

    const card = track.querySelector('.preview-card')
    if (!card) return track.clientWidth * 0.8

    const styles = getComputedStyle(track)
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0
    return card.getBoundingClientRect().width + gap
  }

  function scrollByDirection(direction) {
    const track = trackRef.current
    if (!track) return

    track.scrollBy({
      left: direction * getScrollAmount(),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  function handleTrackKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (canScrollNext) scrollByDirection(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (canScrollPrev) scrollByDirection(-1)
    }
  }

  return (
    <section
      className="campaign-previews"
      aria-labelledby="campaign-previews-heading"
    >
      <div className="campaign-previews__header">
        <div className="campaign-previews__titles">
          <h2 id="campaign-previews-heading" className="campaign-previews__title">
            Campaign previews
          </h2>
          <p className="campaign-previews__subtitle">
            Demo samples — swipe or use the arrows to browse.
          </p>
        </div>

        <div className="campaign-previews__controls">
          <button
            type="button"
            className="campaign-previews__arrow"
            aria-label="Previous campaign previews"
            disabled={!canScrollPrev}
            onClick={() => scrollByDirection(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="campaign-previews__arrow"
            aria-label="Next campaign previews"
            disabled={!canScrollNext}
            onClick={() => scrollByDirection(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="campaign-previews__track"
        tabIndex={0}
        role="region"
        aria-label="Horizontally scrollable campaign previews"
        onKeyDown={handleTrackKeyDown}
      >
        {campaigns.map((campaign) => (
          <article
            key={campaign.id}
            className="preview-card"
            aria-label={`${campaign.subject}, ${campaign.status}`}
          >
            <span
              className={`campaign-status campaign-status--${campaign.status.toLowerCase()}`}
            >
              {campaign.status}
            </span>
            <h3 className="preview-card__subject">{campaign.subject}</h3>
            <p className="preview-card__message">{campaign.preview}</p>
            <p className="preview-card__name">{campaign.name}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CampaignPreviews
