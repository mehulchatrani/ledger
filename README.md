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

Database: Turso/libSQL. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `backend/.env`.

Run with Docker (both services):

```bash
docker compose build
docker compose up
```

This runs the backend on port `4000` and the frontend preview on port `5173`.

Turso manages database availability and backups remotely. Keep the auth token only in environment variables and rotate it if it has been exposed.
