# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the dev server (Express + Vite middleware) on `127.0.0.1:5000`. Single process serves both `/api/*` and the client.
- `npm run build` — Vite builds the client to `dist/public`; esbuild bundles `server/index.ts` to `dist/index.js` (ESM, externals).
- `npm run start` — run the production bundle (`NODE_ENV=production node dist/index.js`). Expects `dist/public` next to the server bundle.
- `npm run check` — type-check the whole repo (`tsc --noEmit`). There is no test suite or linter configured.
- `npm run db:push` — push the Drizzle schema in `shared/schema.ts` to the DB at `DATABASE_URL`. Note: schema is defined but not actually wired up in the runtime (see Architecture).

## Architecture

### Monorepo layout
Three TypeScript roots compiled together (`tsconfig.json` includes all three):
- `client/` — React 18 + Vite SPA, root is `client/` (not the repo root). Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`, `@assets` → `attached_assets/`.
- `server/` — Express server. In dev, mounts Vite as middleware (`server/vite.ts`) so HMR + API share port 5000. In prod, serves the prebuilt SPA from `dist/public`.
- `shared/schema.ts` — Drizzle tables + Zod request schemas imported by both sides.

### Request flow
The Express server is a thin proxy to BetPawa's upstream (`pawagate.replit.app`), not a data owner:
1. Client posts to `/api/:country/betslip/generate` with `{ targetOdds, brandIdentifier }`.
2. Server fetches `pawagate.replit.app/api/sportsbook-plus/v1/events/popular` with headers `X-MiniApp-Env: staging` and `x-pawa-brand: <brandIdentifier>`.
3. Events go through the betslip algorithm (`server/services/betslipService.ts`).
4. `/api/:country/booking/generate` does a similar two-call dance: GET countries → resolve `rootDomain` for the brand → POST `/api/sportsbook/v2/booking-number` with the selection IDs.

Country code in the URL is validated against a hardcoded `SUPPORTED_COUNTRIES` allowlist in `server/routes.ts` but is otherwise unused — the upstream is selected via `brandIdentifier` in the body, not the URL segment. The booking response's `domain` field is hardcoded to `http://gh.staging.betpawa.local:3000` regardless of country.

### Database is staged but not connected
`shared/schema.ts` defines `betslips` / `selections` Postgres tables, `drizzle.config.ts` requires `DATABASE_URL`, and Neon is in deps — but `server/storage.ts` is a `MemStorage` user stub that's never imported. Generated betslips are not persisted. Don't assume DB calls happen until you've wired them up.

### Betslip algorithm (`server/services/betslipService.ts`)
- Only considers `selection.hot === 1` from the upstream events.
- Acceptable range is `targetOdds ± 15%` (tolerance hardcoded).
- Picks randomly between a greedy finder (~70% of calls) and a depth-limited DFS, with multiple random starting points for variety. One selection per `eventId` max.
- Whole call is wall-clock-bounded to 1000ms; if nothing valid is found it falls back to the greedy result or returns 404.

### Frontend shape
- `client/src/App.tsx` reads `?brand=...` from `window.location.search`. The `CountryValidator` rejects missing/unknown brands with `NotFound`. Brand→country mapping is the static `COUNTRIES` array in `client/src/lib/countries.ts` (also surfaced through the `useCountries` hook as a React Query cache for consistency with components that expect a query).
- The app is designed to run **inside an iframe**: `Helmet` is configured with `frameAncestors: ["*"]` and `frameguard: false`. The page communicates with its embedder via `window.parent.postMessage` — message types include `betslip_generator_selections` (on generate), `generated_booking_code`, and `CLOSE` (with `payload.redirectUrl`). Any change to message shapes is a contract break with the embedder.
- Brand routing was migrated from URL path (`/uganda`) to query param (`?brand=betpawa-uganda`) — see commit `7fc82a0`. Don't reintroduce path-based routing.

### Port and host
Port `5000` is hardcoded in `server/index.ts` and bound to `127.0.0.1` only ("the only port that is not firewalled" per the comment — this is a Replit constraint). The Replit deployment maps `localPort 5000` → `externalPort 80`.

## Conventions

- Roboto + lime-green `#9ce800` is the BetPawa brand identity (see `DESIGN_GUIDELINES.md` for the full palette and component patterns). shadcn/ui components live under `client/src/components/ui/` — prefer composing those over hand-rolling Radix.
- Zod schemas in `shared/schema.ts` are the source of truth for API request shapes; both sides import them.
- The CSP in `server/index.ts` permits Google Tag Manager / Analytics — keep it intact when adding script sources.
