# AI Adventure Trip Planner

A visually immersive React SPA that helps users plan adventure trips, paired with a Node/Express/MongoDB auth API.

## Repo layout

```
.
├── src/            # React (Vite) frontend — Antd + Tailwind + Framer Motion
├── server/         # Express + MongoDB auth API (signup, signin, JWT)
└── ...
```

> The frontend lives at the repo root rather than in `client/` for historical reasons. The server lives in `server/`.

## Quick start

You'll run two processes during development.

### 1. API (terminal 1)

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm run dev            # http://localhost:4000
```

See [server/README.md](server/README.md) for endpoints and security notes.

### 2. Frontend (terminal 2)

```bash
npm install            # at the repo root
cp .env.example .env.local   # optional — only needed if VITE_API_URL or image keys differ
npm run dev            # http://localhost:5173
```

The client reads the API base URL from `VITE_API_URL` and falls back to `http://localhost:4000/api`.

## Auth flow

- `/signup` and `/signin` post to the API and store the returned JWT in `localStorage` under `adventure.auth.token`.
- `AuthProvider` (`src/auth/AuthProvider.jsx`) hydrates the current user on mount via `GET /api/auth/me`.
- `ProtectedRoute` (`src/auth/ProtectedRoute.jsx`) guards `/dashboard` and bounces unauthenticated users to `/signin`, preserving the original location for post-login redirect.
- Sign-out clears the token and resets the auth context.

## Scripts (frontend)

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # eslint
npm run preview   # preview prod build
```
