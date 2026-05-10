# Vyb Unified Master Prompt Pack

Use this as the single operational prompt for Cursor agent sessions.

## Mode Selection

- **Variant A (Blueprint):** use when defining architecture and milestone strategy.
- **Variant B (Atomic Tasks):** use for deterministic implementation loops and quality gates.
- **Variant C (Single-Shot Ops):** use for high-autonomy long runs.

## Global Objective

Build Vyb as a premium, human-first, cross-platform desktop social platform with:

- Next.js + TypeScript strict UI
- Tauri desktop shell for Linux/macOS/Windows
- Supabase + Drizzle data model
- Clerk auth
- Realtime communication and notifications
- Safety/wellness systems that reduce doomscrolling

## Hard Rules

- No untyped API boundaries.
- No mutation without authorization checks.
- No secrets in client-rendered code.
- No half-finished modules declared complete.
- Run lint/typecheck/tests/build after each completed task cluster.

## Variant A - Blueprint

1. Produce architecture and threat model docs.
2. Define domain boundaries and service responsibilities.
3. Define data flow for auth/feed/chat/events/marketplace.
4. Define phased roadmap from MVP to v1.

## Variant B - Atomic Task Loop

Complete tasks in order:

0. bootstrap + quality gates
1. design system foundation
2. Drizzle schema v1 + migrations + seed
3. auth + protected shell
4. onboarding + profile setup
5. feed read path
6. post creation
7. search foundation
8. notifications + realtime
9. chat v1
10. safety + wellness
11. events v1
12. marketplace v1
13. AI adapter layer
14. SEO + PWA + observability

## Variant C - Single-Shot Ops

Execute in waves:

- Wave A: foundation, docs, CI, env validation, desktop shell
- Wave B: schema + auth + middleware
- Wave C: onboarding + feed + post + search + notifications
- Wave D: hardening (security, a11y, performance, release readiness)

Only pause for genuine blockers (missing credentials or external setup).

## Desktop-Specific Constraints

- Tauri window is transparent, frameless, glass aesthetic.
- Installer targets enabled for Windows/macOS/Linux.
- Use platform-safe behavior for title-bar, shortcuts, notifications, dialogs.

## Progress Update Template

1. What was built
2. Files changed
3. Schema/API changes
4. Security/a11y considerations
5. How to run/test
6. Next high-impact step
