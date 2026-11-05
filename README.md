# Mailroom

Email campaign manager with a React + Vite frontend and an Express + MongoDB backend.

Live campaign drafts and subscribers are stored in MongoDB and scoped to the signed-in account. Browser `localStorage` is preserved only as a backup you can explicitly import.

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a reachable MongoDB URI)

## Frontend

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3002`.

Other frontend commands:

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

Default API URL: `http://localhost:3002`

Health check:

```bash
curl http://localhost:3002/api/health
```

### Backend environment variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017` |
| `MONGODB_DB_NAME` | Dedicated Mailroom database | `mailroom` |
| `PORT` | API port (keep different from PeoplesNote) | `3002` |
| `CLIENT_ORIGIN` | Frontend origin for CORS cookies | `http://localhost:5173` |
| `SESSION_SECRET` | Server secret for session-related hardening | long random string |
| `SESSION_TTL_MS` | Session lifetime in ms | `604800000` |
| `COOKIE_NAME` | HttpOnly session cookie name | `mailroom_session` |
| `COOKIE_SECURE` | Set `true` behind HTTPS | `false` |

### Useful backend scripts

```bash
cd server

# Explicitly assign ownerless DB records to an account (never automatic)
npm run assign-ownership -- --email you@example.com
npm run assign-ownership -- --email you@example.com --dry-run

# Verify two accounts cannot access each other's data
npm run verify-isolation
```

## Request flow

1. Browser signs up / logs in via `POST /api/auth/signup` or `/api/auth/login`.
2. Server creates a MongoDB session and sets an HttpOnly cookie.
3. Server returns a CSRF token; the frontend sends it as `X-CSRF-Token` on mutating requests.
4. Campaign and subscriber routes derive ownership from the session user id only.
5. UI state updates only after successful API responses.
6. Settings → **Import browser backup** posts localStorage drafts/subscribers to `/api/import/local-backup`.

## Notes

- Demo campaigns stay client-side sample data and are never written to MongoDB.
- Subscriber emails are unique per account; CSV import never auto-resubscribes unsubscribed addresses.
- Ownerless database records are preserved until you run the ownership migration command.
- Email delivery and scheduling are not implemented yet.
