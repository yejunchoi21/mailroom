# Mailroom

Email campaign manager (React + Vite frontend, Express + MongoDB backend foundation).

Campaign drafts and subscribers are stored in the browser `localStorage` for this milestone. The API currently exposes a MongoDB health check only.

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a reachable MongoDB URI)

## Frontend

```bash
npm install
npm run dev
```

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

Copy `server/.env.example` to `server/.env` and adjust:

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017` |
| `MONGODB_DB_NAME` | Dedicated Mailroom database (does not use PeoplesNote data) | `mailroom` |
| `PORT` | API port (keep different from PeoplesNote) | `3002` |

Production-style start:

```bash
cd server
npm start
```

## Notes

- Demo campaigns stay separate from your local drafts.
- Manually added subscribers are labeled as test data.
- CSV import previews valid, invalid, and duplicate rows, and never auto-resubscribes existing unsubscribed addresses.
