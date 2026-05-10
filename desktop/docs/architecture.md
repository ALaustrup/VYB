# Vyb Desktop Architecture

## System Context

- **Client shell:** Tauri v2 desktop app (Windows/macOS/Linux).
- **UI layer:** Next.js App Router + TypeScript + Tailwind + shadcn primitives.
- **Backend services:** Supabase Postgres + Realtime, Clerk auth, Upstash Redis for hot paths.
- **Observability:** Sentry for frontend/runtime errors.

## Domain Boundaries

- **Identity:** Clerk auth, user profile sync, session + privacy preferences.
- **Social graph:** follows/connections, trust state, block/mute/report.
- **Content:** posts, comments, reactions, journaling, media metadata.
- **Realtime comms:** DM rooms, messages, typing presence, notifications.
- **Experiences:** events/RSVP + marketplace listings/transactions.
- **Wellness:** time limits, focus mode, gentle nudges.

## Core Data Flows

1. **Auth flow**
   - Desktop renderer requests Clerk sign-in.
   - Clerk webhook syncs user to app DB.
   - Middleware enforces protected routes.
2. **Feed flow**
   - Query uses cursor pagination + ranking (recency + social proximity + interests).
   - Realtime channel pushes deltas for inserts/engagement.
3. **Messaging flow**
   - Message mutation validates input + membership.
   - Persist to DB then publish channel event (delivery + typing).
4. **Events flow**
   - Host creates event; attendees RSVP; realtime updates attendee state.
5. **Marketplace flow**
   - Listing creation + intent transaction; trust checks and abuse flags before high-risk actions.

## Security Highlights

- Zod schema at every external boundary.
- AuthN/AuthZ on all mutations.
- Rate limiting on auth, posts, chat, search.
- Signed webhook verification for Clerk/Stripe.
- No plaintext secrets in renderer; desktop IPC boundaries explicitly validated.
