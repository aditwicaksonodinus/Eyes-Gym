# AGENTS.md — Eyes-Gym (Web Senam Mata)

## Status
- **Greenfield**: no code, no `package.json`, no git repo yet. Only `spesifikasi-web-senam-mata.md` exists — it is the requirements spec and must be read before any implementation.

## Project
- Web app for digital eye strain relief (senam mata / eye exercises) with an online eye self-check.
- **UI copy language: Indonesian.** Spec CTAs: "Mulai Tes Mata", "Mulai Senam Mata", "Selesai", "Selanjutnya". Do not default to English UI.

## Tech stack (locked by spec §5)
- Next.js 14+ (App Router), Tailwind CSS + shadcn/ui, Framer Motion (exercise eye-movement animations), Zustand or React Context + custom `useTimer` hook.
- PWA: `next-pwa` + Web Notifications API for 20-20-20 reminders (works with tab in background). Vibration cue on mobile.
- Eye test: fully client-side custom component (Canvas/SVG Snellen chart, calibrated via `window.devicePixelRatio`) — **no backend required**.
- Testing: Vitest (unit) + Playwright (E2E). Analytics: Plausible/Umami — **no Google Analytics**. License: MIT. Deploy: Firebase.
- Optional (only if progress/history features are added): Supabase/PostgreSQL + Prisma, NextAuth/Clerk.

## Pages (spec §4)
- `/` — landing: hero + CTA "Mulai Tes Mata" + CTA "Mulai Senam Mata", education section, exercise card carousel, footer with GitHub link.
- `/test` — eye self-check. **Screening only, NOT a medical diagnosis — keep a disclaimer.** Ends with CTA recommending exercises.
- `/exercises` — grid of exercise cards; filters: duration, category (relaksasi / fokus / gerakan).
- `/exercises/[slug]` — exercise detail: visual animation/illustration guide, countdown timer, step-by-step instructions, "Selesai" + "Selanjutnya" buttons.
- `/exercises/session` — sequential playlist session mode (guided workout style).

## Exercise content source of truth (spec §2)
- 10 exercises with exact durations/reps in the spec table — build the exercise registry from it, do not invent values:
  - 20-20-20 rule: 20s every 20 min; Palming: 30–60s; Blinking: 3 sets; Near-far focus: 10 reps; Figure-8: 30s × 2 directions; Eye rolling: 5–8× per direction; Up-down/left-right: 3 reps per direction; Pencil push-up: 5–10 reps; Zig-zag: 30s; Diagonal gaze: 5–8 reps per direction.
  - Categories map to: relaksasi (palming, blinking, 20-20-20), fokus (near-far, pencil push-up), gerakan (figure-8, rolling, up-down/left-right, zig-zag, diagonal).

## Design constraints (spec §6 — non-negotiable)
- Soft green/teal base + white/light gray. **No neon or high-contrast colors** (the product itself must not strain eyes).
- Sans-serif with generous size and letter-spacing (Inter/Geist) for readability.
- **Dark mode required** via `next-themes`.

## Environment
- Node.js 20.19.0 via NVM (CachyOS/Arch). No project-specific scripts exist yet — verify commands after scaffolding (e.g., `npm run dev`, `npx next lint`, `npx tsc --noEmit`, `npx vitest`, `npx playwright test`).
