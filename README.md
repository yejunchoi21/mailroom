# Mailroom

Email campaign manager with a React + Vite frontend and an Express + MongoDB backend.

Live campaign drafts and subscribers are stored in MongoDB and scoped to the signed-in account. Browser `localStorage` is preserved only as a backup you can explicitly import.

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a reachable MongoDB URI)
- A [Resend](https://resend.com) API key for test/scheduled owner emails

## Frontend

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3002`.

```bash
npm run build
npm run preview
npm run lint
npm test
```

## Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

```bash
cd server
npm test
npm run verify-isolation
```

### Backend environment variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` / `MONGODB_DB_NAME` | Dedicated Mailroom database |
| `PORT` | API port (default `3002`) |
| `CLIENT_ORIGIN` | Frontend origin for CORS cookies |
| `SESSION_SECRET` / `SESSION_TTL_MS` / `COOKIE_*` | Session cookie settings |
| `RESEND_API_KEY` | Resend API key (server only) |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Mailroom <you@your-domain.com>` |

### Sender verification & test recipients

- Verify your sending domain in the Resend dashboard: https://resend.com/domains
- Put the verified address in `RESEND_FROM_EMAIL`
- With an unverified/test setup, Resend typically only allows sending to your own account email (and provides addresses like `delivered@resend.dev` for provider testing)
- Mailroom only sends test/scheduled messages to the **signed-in user's account email** in this milestone
- Automated tests mock Resend and never send real email
- A `202 submitted` / provider message id means Resend **accepted** the request — not that inbox delivery is confirmed

### Scheduling behavior

- Schedule stores date/time/timezone as a UTC instant plus a **content snapshot**
- Delivery is owner-email only for this learning milestone
- While the backend runs, a worker checks due schedules **once per minute**
- Due jobs are claimed atomically (`Scheduled` → `Processing`) so overlapping ticks cannot double-claim
- Sends use Resend idempotency keys (`schedule-send/<userId>/<scheduleId>`) to reduce duplicates (Resend keeps keys ~24 hours)
- States: `Scheduled`, `Processing`, `Submitted`, `Failed`, `Cancelled`
- Cancel is allowed only before processing begins
- **No automatic retries** yet
- **Restart:** if the process stops, due mail waits until the backend is running again; already `Submitted` sends are not resent by Mailroom; idempotency helps if a crash happened after Resend accepted but before DB update
- Scheduling requires the backend process to remain running

### Ownership migration

```bash
cd server
npm run assign-ownership -- --email you@example.com
npm run assign-ownership -- --email you@example.com --dry-run
```

## Request flow (send / schedule)

1. User saves a campaign draft to MongoDB
2. `POST /api/campaigns/:id/send-test` (CSRF + auth + rate limit) emails the owner only
3. `POST /api/campaigns/:id/schedule` stores snapshot + UTC time
4. Scheduler claims due rows and calls Resend with an idempotency key
5. `POST /api/schedules/:id/cancel` cancels while still `Scheduled`

## Notes

- Demo campaigns stay client-side sample data and are never emailed from MongoDB
- Subscriber-wide delivery is not implemented yet
