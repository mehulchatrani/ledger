# Purchase/Sell Entry Webapp

This workspace contains a minimal full-stack app (frontend + backend) for recording purchase and sell entries.

Run backend:

```bash
cd backend
npm install
npm start
```

Authentication setup:

```bash
cd backend
cp .env.example .env
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
```

Put the generated hash in `AUTH_PASSWORD_HASH`, choose the client's `AUTH_USERNAME`, and set a long random `JWT_SECRET`. For Google login, create a Google OAuth web client, add `http://localhost:5173` as an authorized JavaScript origin, and set its client ID in both `backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`). Set `GOOGLE_ALLOWED_EMAIL` to the client's verified Google email. The login screen also provides password registration, with unique usernames enforced; the configured Google email remains restricted to that specific client account.

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend API:

- `GET /api/records` - list records
- `POST /api/records` - create record
- `PUT /api/records/:id` - update record
- `DELETE /api/records/:id` - delete record

Database: SQLite file at `backend/data.db` (low maintenance, zero-cost to host locally)

Run with Docker (both services):

```bash
docker compose build
docker compose up
```

This runs the backend on port `4000` and the frontend preview on port `5173`.

Production DB guidance:

- For low-cost, low-maintenance single-server deployments you can keep using SQLite, but it doesn't scale across multiple instances.
- For a secure, production-ready option with modest cost, use a managed Postgres provider (Supabase, Neon, or managed RDS). Postgres is widely supported, secure, and has low-cost tiers.
- If you want, I can add a Postgres switch in the backend and a `docker-compose.postgres.yml` to run Postgres locally for testing.

Backup recommendation (SQLite)

- Create periodic backups of `backend/data.db` (simple and reliable). I added a basic backup script at `backend/backup.sh`.
- Run a backup manually:

```bash
cd backend
npm run backup
```

- Example cron (daily at 2am):

```cron
0 2 * * * cd /path/to/purchase-sell-book/backend && /bin/sh backup.sh
```

- For remote backups, copy the generated files in `backend/backups/` to a secure object store (S3, Backblaze B2) or use `rsync` to a backup host.
