# Learnings — Eyes-Gym pure logic layer

## Pure-factory state machine pattern (Tasks 11 & 12)

Both `detailMachine` (one-exercise lifecycle) and `sessionMachine` (playlist
orchestrator) follow the same injectable, deterministic factory pattern. Reuse
it for any new stateful logic.

### Shape
- `createXMachine(deps, options?)` — a factory, not a class. Returns an
  imperative handle (object of methods) closing over `let` state.
- No `setInterval`, no `Date.now`, no React. Time is supplied via an injected
  `clock: () => number` (ms) so tests drive it with a fake clock.
- State advances ONLY through returned methods → fully deterministic.

### Conventions that worked
- **Status union** (`idle | running | done`, etc.) as the single source of
  truth for transitions; guard each method with `if (status !== "X") return;`.
- **`getState()` returns a fresh snapshot object** (never the internal
  mutable state) so callers can't mutate internals.
- **`fireOnce` helper** for `onDone`/`onComplete` callbacks: a `doneFired`
  boolean guards exactly-once firing across re-entrant calls.
- **Forward-only / no-skip**: `sessionMachine.next()` and
  `completeCurrent()` each move the pointer by exactly one. There is no
  jump API, so playlist order is structurally unskippable.
- **Separation of concerns**: `sessionMachine` is a high-level orchestrator
  and deliberately does NOT reimplement countdown/rep logic — that lives in
  `detailMachine`. Keep machines single-responsibility.
- **`current()` returns `null` when `done`** (and `currentSlug` is `undefined`
  when done) so the "no current exercise" state is explicit, not a stale
  pointer.
- **Don't mutate inputs**: never touch the caller's `exercises`/`playlist`
  array; track completion in an internal `Set`.

### Testing (Vitest)
- Fake clock = `{ now: () => t, tick(ms), set(ms) }` mutable closure; pass
  `clock.now` into the factory. No real timers.
- Build fixtures from the REAL registry (`getExercise(slug)`) so machines are
  exercised against genuine `Exercise` shapes.
- Assert the full `getState()` snapshot with `toEqual` for the initial/reset
  states; assert individual fields for transitions.
- Cover: initial status, transition guards (no-op when wrong status),
  order-enforcement (index increments by exactly 1), reset, and
  callback-exactly-once.

### Tooling notes
- `npx tsc --noEmit` and `npx vitest run` are the acceptance gates.
- Path alias `@/*` → `./src/*` (tsconfig). Import `Exercise` from
  `@/lib/exercises`.
- `appStore.ts` (Zustand) had a transient type error where new action methods
  (`recordValueMoment`, `setPrimerShown`) were added to `AppState` but not to
  the `Omit<AppState, ...>` exclusion list on `initialAppState`. When adding
  store actions, update BOTH the interface and the Omit list.

## Task 17 — 20-20-20 reminder (Web Worker + permission UX)

- **Keep `reminder` shape pristine**: `appStore.test.ts` asserts `reminder`
  equals exactly `{ enabled: false, interval: 20 }`. Put `valueMoments`/
  `primerShown` in a SEPARATE `reminderMeta` slice so the test stays green.
- **`shouldShowPrimer` is literal**: true when `permission !== "denied"`.
  `unsupported` (no Notification API) is NOT denied → returns true. The
  component gates the real `requestPermission()` on `typeof Notification ===
  "undefined"`, so the primer may show on unsupported but tapping is a no-op.
  Don't "fix" the helper to treat unsupported as false.
- **`requestPermission()` only on tap**: never in an effect/mount. Both the
  primer button and the settings toggle call it only inside click handlers.
- **Worker is classic, lives in `public/`**: cannot import TS → hardcode
  `20 * 60 * 1000`. Reference as `new Worker("/reminder-worker.js")`.
- **Notify only when hidden**: gate `showNotification` on
  `document.visibilityState === "hidden"` + `Notification.permission ===
  "granted"`. Use `navigator.serviceWorker?.ready` (SW may be absent). Vibration
  guarded by `canVibrate()` (`"vibrate" in navigator`), SSR/test-safe.
- **Pure logic separated**: `src/lib/reminder.ts` has zero side effects (no
  global `Notification`/`navigator` access except the guarded `canVibrate`),
  so `reminder.test.ts` runs without a DOM. Permission is passed in as a
  string, never read from the global.
- **Indonesian copy**: notification body `Waktunya istirahat mata — terapkan
  20-20-20`; UI notes limitation `berjalan saat tab terbuka`.

## Task 9 — triage + symptom questionnaire (TDD, pure)

- **Two pure modules, no React**: `questions.ts` (data + `scoreBand`) and
  `triage.ts` (`triageAcuity` + `triage`). Both import nothing from React/DOM.
- **`triageAcuity` wraps `bandForLogMAR`** from `@/lib/test/acuity` and derives
  `best`/`worst`/`asymmetry` from `{ leftLogMAR, rightLogMAR }`. `triage` then
  consumes that `TriageAcuityResult` (not raw logMAR) — keep that boundary.
- **Branch precedence is safety-critical**: referral MUST win over normal and
  borderline. Triggers: `worst > 0.5` (worse than 20/60) OR `asymmetry >= 0.2`.
  A referral returns `cta: null` — NEVER an exercise CTA. Test asserts
  `res.cta === null` and `res.cta !== "exercise"` even with high symptomScore.
- **Borderline covers symptomScore >= 3** (both `sedang` 3–4 and `tinggi` >=5),
  not just the literal 3–4 in the spec — avoids a routing gap when acuity is
  healthy but symptoms are high. Normal requires BOTH eyes `logMAR <= 0.1` AND
  `symptomScore <= 2`.
- **Disclaimers are mandatory**: every `TriageResult` carries
  `disclaimer: "Ini pemeriksaan mandiri, bukan diagnosis medis."` and referral
  message points to `dokter mata`. No diagnosis language anywhere.
- **TDD order that worked**: write `questions.ts` + `triage.test.ts` first, then
  `triage.ts`. Watch the asymmetry trap — a borderline "worst eye 0.2–0.4"
  fixture must keep `asymmetry < 0.2` (e.g. left 0.2 / right 0.3), otherwise the
  referral rule fires first and the test fails.
- **`scoreBand` ranges**: 0–2 `rendah`, 3–4 `sedang`, >=5 `tinggi`.
