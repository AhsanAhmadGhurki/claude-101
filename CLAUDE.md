# AI Adventure Trip Planner — Project Rules

## Project Overview

A visually immersive React SPA that helps users plan adventure trips (trekking, road trips, hiking, nature exploration). The AI generates personalized itineraries from a short user prompt. The experience is presented as a cinematic, animation-rich journey rather than a plain form/result UI.

## Core Stack

- **Vite + React 19** (SPA, no SSR)
- **JavaScript** (not TypeScript)
- **Ant Design 6** — primary UI system
- **Tailwind CSS 3** — utility layer only
- **Framer Motion** — animations
- **React Router** — client-side routing
- **@iconify/react** — icons

AI integration (Claude API) is **deferred**. Use mock JSON responses for now.

## Development Commands

```bash
pnpm dev       # start Vite dev server
pnpm build     # production build
pnpm lint      # eslint
pnpm preview   # preview prod build
```

## UI System Rules

**Ant Design is the primary UI system. Tailwind is a utility layer only.**

### Use Ant Design for:
- Buttons, Inputs, Selects, Forms
- Cards, Modals, Drawers, Tooltips
- Layout components (Layout, Row, Col, Space)
- Feedback (message, notification, Spin, Skeleton)
- Anything that has a built-in Antd component

### Use Tailwind ONLY for:
- Spacing utilities (`p-4`, `mt-6`, `gap-4`)
- Flex/grid tweaks (`flex`, `grid-cols-3`)
- Background gradients and decorative effects
- Responsive adjustments (`md:`, `lg:`)
- Minor positional/layout overrides on top of Antd

### Do NOT:
- Build custom buttons, inputs, or form controls in Tailwind when Antd has them
- Override Antd component internals with Tailwind class hacks — use Antd's `theme` config or `className`/`style` props instead
- Mix Tailwind utility-heavy components alongside Antd components for the same UI role

If you find yourself reaching for Tailwind to build a component Antd already provides, stop and use the Antd component.

## Code Style

- 2-space indentation
- Named exports preferred
- Keep components small and focused
- Modern ES6+ JavaScript
- No TypeScript

## Architecture

### Folder Structure

```
src/
├── main.jsx                # entry point, router root
├── App.jsx                 # route definitions
├── index.css               # tailwind directives only
├── assets/                 # static images, svgs
├── components/
│   ├── layout/             # Header, Footer, PageShell
│   └── ui/                 # shared composed UI (e.g. AnimatedCard)
├── pages/
│   ├── Home/               # Hero adventure entry
│   ├── Explore/            # Destinations grid
│   ├── TripBuilder/        # AI generation flow
│   └── TripDetails/        # Final itinerary view
├── lib/
│   ├── ai/                 # Claude integration (later) + mock provider
│   └── utils/              # helpers
├── mocks/                  # mock AI responses (JSON)
├── hooks/                  # custom react hooks
└── theme/                  # Antd ConfigProvider theme
```

### Layering

- **pages/** — route-level components, compose from `components/`
- **components/** — reusable, no page-specific logic
- **lib/ai/** — single entry point for AI calls. Today returns mock JSON, later swaps to Claude API. Pages must call through this, never directly.
- **mocks/** — static JSON imported by `lib/ai/` while AI is mocked

### State

- Local `useState` for UI state
- Context for trip data shared across Builder → Details
- No Redux/Zustand unless complexity demands it

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
- Configure Antd tokens via `ConfigProvider` in `src/theme/`

## AI Integration (Deferred)

Build the full UX against mocked responses first. When Claude is wired in:
- API key via `VITE_ANTHROPIC_API_KEY` (or proxy through a small backend — direct browser calls leak the key)
- Single async function in `lib/ai/generateTrip.js` — pages don't change

Do not add Claude API code until UI flow is complete and approved.

## Best Practices

- Server-first thinking is N/A here (SPA) — optimize for perceived performance via animation and skeleton states
- Reuse components, don't duplicate
- Keep route components thin; push logic into hooks and `lib/`
- Mobile responsiveness from day one (Tailwind breakpoints + Antd Grid)
