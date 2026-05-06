# Adventure AI — Auth API

Node + Express + MongoDB backend for the AI Adventure Trip Planner. Provides email/password signup, JWT-based signin, and a protected dashboard endpoint.

## Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGODB_URI and JWT_SECRET
npm run dev            # starts on http://localhost:4000 with --watch
```

You need a running MongoDB. Either install locally and use `mongodb://127.0.0.1:27017/adventure-ai`, or paste an Atlas SRV string into `MONGODB_URI`.

## Endpoints

| Method | Path                | Auth   | Body                             | Returns                  |
| ------ | ------------------- | ------ | -------------------------------- | ------------------------ |
| GET    | `/api/health`       | —      | —                                | `{ ok: true }`           |
| POST   | `/api/auth/signup`  | —      | `{ name, email, password }`      | `{ token, user }`        |
| POST   | `/api/auth/signin`  | —      | `{ email, password }`            | `{ token, user }`        |
| GET    | `/api/auth/me`      | Bearer | —                                | `{ user }`               |
| GET    | `/api/dashboard`    | Bearer | —                                | `{ message, user }`      |

Protected routes expect `Authorization: Bearer <jwt>`.

## Layout

```
server/
├── src/
│   ├── config/        # env loader, mongo connection
│   ├── controllers/   # request handlers
│   ├── middleware/    # requireAuth, error handler
│   ├── models/        # Mongoose schemas
│   ├── routes/        # express routers
│   ├── utils/         # token signing, ApiError
│   ├── app.js         # builds the express app
│   └── index.js       # entrypoint: connects DB, listens
└── .env.example
```

## Security notes

- Passwords are hashed with bcrypt (cost 12). The `passwordHash` field is `select: false` so it never leaks via `find()`.
- `/api/auth/signin` returns the same error for unknown email and bad password — don't help attackers enumerate accounts.
- Auth endpoints are rate-limited (20 requests / 15 min / IP).
- JWTs are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default `7d`). Use a long random secret in production and rotate it via re-deploy.
- CORS is locked to `CLIENT_ORIGIN`.
