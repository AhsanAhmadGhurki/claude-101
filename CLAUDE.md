# AI Adventure Trip Planner — Project Rules

> **This file is the single source of truth for the architecture.** It overrides all prior guidance.

## Project Overview

A visually immersive React SPA that helps users plan adventure trips (trekking, road trips, hiking, nature exploration). The AI generates personalized itineraries from a short user prompt. The experience is presented as a cinematic, animation-rich journey rather than a plain form/result UI.

The system is full-stack: a React + TypeScript frontend talks to a Node.js + Express + MongoDB backend. The frontend communicates with the backend exclusively through a single API layer.

## Migration Status (in progress)

The project is being migrated to the target architecture **incrementally**. Do not attempt a big-bang rewrite.

Order of operations:
1. Folder restructuring (create target shape, move existing code)
2. File moves (rehome existing JS/JSX into the new layout)
3. TypeScript conversion (file-by-file; allowJs while in transition)
4. UI cleanup (gradual Antd → Tailwind migration)

Until migration completes, the repo will contain a mix of old and new conventions. New code must follow the target architecture below; existing code stays until explicitly migrated.

## Target Root Structure

```
client/   # Frontend (React + Vite + TypeScript)
server/   # Backend (Node.js + Express + MongoDB)
docs/     # Architecture and technical documentation (.md files)
```

## Frontend — `client/src/`

```
client/src/
├── pages/
│   ├── Public/          # Unauthenticated, marketing/info pages
│   ├── Auth/            # Sign-in, sign-up, password flows, email verification
│   ├── User/            # Authenticated end-user features
│   ├── ContentCreator/  # (reserved) creator-only features
│   └── Admin/           # (reserved) admin-only features
├── components/          # Reusable UI only — no business logic, no API calls
├── hooks/               # Custom React hooks
├── store/               # Global state (Zustand or Redux)
├── api/                 # Single boundary for backend calls
├── services/            # Business logic / orchestration
├── types/               # Shared TypeScript types and interfaces
└── ...                  # assets/, mocks/ etc. as needed
```

### Frontend rules (mandatory for new code)

- **TypeScript everywhere.** New files must be `.ts` / `.tsx`. Legacy `.js` / `.jsx` files convert incrementally.
- **Pages organized by role.** Drop new pages into the correct role folder. Empty role folders (`Admin/`, `ContentCreator/`) stay reserved.
- **No business logic in components.** Components render and emit events; logic lives in `hooks/`, `services/`, or `store/`.
- **All API calls go through `client/src/api/`.** Components must not call `fetch` / `axios` directly.
- **Tailwind for new UI.** New components use Tailwind utilities only. Existing Antd usage stays until explicitly migrated (see UI System Rules below).
- **Mobile-first.** Use Tailwind breakpoints from day one.

## Backend — `server/`

```
server/
├── models/       # Mongoose schemas
├── routes/       # API endpoints — thin
├── controllers/  # Request handling — thin
├── services/     # Business logic
├── middleware/   # Auth, CSRF, logging, error handling
├── validators/   # Input validation (zod / express-validator)
├── queues/       # Background job definitions
├── workers/      # Job processors
└── socket/       # Real-time (WebSocket) handlers
```

### Backend rules

- **MVC + service layer.** Routes wire URLs to controllers. Controllers parse the request and call services. Services contain business logic. Models are pure data.
- **Validate at the boundary.** All write endpoints validate input via `validators/` before the controller acts.
- **Routes and controllers stay thin.** No business logic in either.
- **Scalability surfaces stay live.** `queues/`, `workers/`, `socket/` exist as folders even when empty. Wire them up when first needed; don't pre-install heavy infrastructure libraries before there's a feature to justify them.
- **Clean response shape.** Successful responses return JSON with predictable keys; errors flow through the central error handler.

> Current backend lives at `server/src/`. Either flatten to `server/<folder>/` or accept the `src/` wrapper — decide once, apply everywhere. Until then, treat `server/src/<folder>/` as equivalent to the spec's `server/<folder>/`.

## Integration

- Frontend talks to the backend **only** via `client/src/api/`.
- Backend returns clean, structured JSON. Errors carry a stable `code` plus a human-readable `error` field.
- Auth is cookie-based (HttpOnly access + refresh + CSRF double-submit). The API client handles refresh transparently.

## UI System Rules — Hybrid (transition policy)

The project is migrating away from Ant Design toward Tailwind-only. **No sudden removal.**

### For NEW components and pages
- Tailwind only.
- Do not import from `antd`.
- Build form controls, buttons, modals, etc. from primitives + Tailwind (or extract to `components/ui/`).

### For EXISTING Antd code
- Stays as-is. Do not rip out working Antd usage opportunistically.
- When meaningfully editing an Antd component, migrate it to Tailwind in the same change if the scope is contained. Otherwise leave it.
- The `ConfigProvider` and `theme/` setup remain until the last Antd consumer is gone.

### Never
- Mix Antd and Tailwind to build the *same* control. Pick one per component.
- Override Antd internals with Tailwind class hacks.

## Tech Stack

**Frontend**
- Vite + React 19 (SPA, no SSR)
- TypeScript (target); JavaScript (legacy, being migrated)
- Tailwind CSS 3 (primary); Ant Design 6 (legacy, being phased out)
- Framer Motion — animations
- React Router 7 — client-side routing
- @iconify/react — icons

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (cookie-based) + bcryptjs
- Nodemailer for transactional email
- (planned) BullMQ / Redis for queues; socket.io for realtime

## Development Commands

```bash
# frontend (run from repo root until client/ migration completes)
pnpm dev        # start Vite dev server
pnpm build      # production build
pnpm lint       # eslint
pnpm preview    # preview prod build

# backend
cd server && pnpm dev    # node --watch src/index.js
cd server && pnpm start  # production
```

After the `client/` migration, frontend commands move under `client/`.

## State

- Local `useState` for UI state.
- Context for cross-route data (e.g., active trip across Builder → Details).
- Global state lives in `store/` (Zustand preferred when added). No Redux unless complexity demands it.
- Auth state lives in the auth context / store.

## Animation Guidelines

Framer Motion is core to the product feel, not optional polish.

- Hero: fade + slide-up on mount, parallax background layers
- Cards: hover scale + soft glow, scroll-reveal on entry
- Page transitions: fade between routes
- AI generation: typing/loader animation while mock resolves

Keep animations performant (transform/opacity only). Avoid animating layout properties.

## Theme

- Nature-inspired: green, blue, earthy tones
- Dark cinematic mode by default
- Glassmorphism on input/card surfaces
- During the hybrid period, Antd tokens are still configured in `src/theme/`. New Tailwind components read color/spacing tokens from `tailwind.config.js`.

## AI Integration (Deferred)

Build the full UX against mocked responses first. When Claude is wired in:
- API key via `VITE_ANTHROPIC_API_KEY` (or proxy through the Express backend — direct browser calls leak the key, prefer the backend proxy).
- Single async entry point in `client/src/services/ai/` — pages don't change.
- Mock fixtures stay in `client/src/mocks/` until real responses replace them.

Do not add Claude API code until the UI flow is complete and approved.

## Code Style

- 2-space indentation
- Named exports preferred
- Keep components small and focused
- Modern ES6+ / TypeScript
- New code: TypeScript. Legacy JS files convert one at a time.

## Best Practices

- SPA — optimize for perceived performance via animation and skeleton states
- Reuse components; don't duplicate
- Keep route components thin; push logic into `hooks/` and `services/`
- Mobile responsiveness from day one
- Always validate input at the backend boundary; never trust the client
