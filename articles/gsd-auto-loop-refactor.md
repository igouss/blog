---
title: "Killing a 1892-line god function in GSD-2"
date: "2026-03-20"
---

`auto-loop.ts` in [GSD-2](https://github.com/gsd-build/gsd-2) was 1892 lines. One function — `autoLoop` — was ~1078 of them. It did everything: resource staleness checks, budget guards, dispatch, retry logic, stuck detection, UAT pauses, milestone transitions, verification. A god function in the truest sense.

This is a write-up of the four-PR sequence I used to dismantle it.

## Why it was a problem

Long functions aren't inherently bad. Long functions that are also load-bearing, frequently modified, and have implicit phase boundaries marked by `───` ASCII separators — those are a problem. Every edit required reading 1000+ lines to understand the blast radius. Blame annotations were useless. Tests couldn't isolate individual behaviors.

The separator comments were the tell: the original author knew there were phases, they just never extracted them.

## PR sequence

### 1. Code smells first (#1602)

Before touching structure, fix the things that would make structural changes messy:

- `closeoutAndStop` was duplicated four times. Extracted to a helper.
- `isRetry` was shadowing an outer variable. Renamed to `isRetryForOutcome`.
- Budget alert handling was an if/else cascade. Replaced with a `BUDGET_THRESHOLDS` lookup table.
- `generateMilestoneReport` was inlined twice. Extracted.
- `_prefs` parameter on `runUnit` was unused. Removed from the function and all call sites.

140 additions, 141 deletions. Net zero. Clean slate.

### 2. Mechanical cleanup (#1616)

Two specific issues before the main extraction:

`MAX_RECOVERY_CHARS` was declared as `const` inside the `while` loop body — reallocated on every iteration. Moved to module level.

`loadEffectiveGSDPreferences()` was called 9 times per loop iteration. It hits disk. Moved the call to once per iteration, stored in `prefs`, shared across all the former call sites.

These were deliberately separate from the structural work so reviewers could verify zero behavior change in isolation.

### 3. Tests before merge (#1645)

The sidecar dispatch path had a routing invariant that wasn't tested: when a sidecar item is dequeued at loop top, it bypasses Phases 1–3 entirely. Hook sidecars skip post-unit verification. Triage sidecars run it.

These contracts existed in the code. They weren't pinned anywhere. Before merging the pipeline extraction, I added 3 tests locking the behavior. If the refactor broke sidecar routing, you'd know immediately instead of finding out in production.

All 61 tests passed before the structural PR landed.

### 4. Pipeline extraction (#1659)

The main event. Extracted `autoLoop`'s body into 5 named pipeline phases, each returning a discriminated union:

```typescript
type PhaseResult<T> =
  | { kind: "continue"; value: T }
  | { kind: "break" }
  | { kind: "next" };
```

| Function | What it covers |
|---|---|
| `runPreDispatch` | Staleness check, cache invalidation, health gate, worktree sync, milestone transition, terminal conditions |
| `runGuards` | Budget ceiling, context window guard, secrets re-check |
| `runDispatch` | `resolveDispatch`, stop/skip handling, stuck detection, pre-dispatch hooks |
| `runUnitPhase` | Retry detection, preconditions, prompt injection, model selection, `runUnit()`, artifact verification |
| `runFinalize` | Post-unit verification, UAT pause, verification gate, step-wizard exit |

`autoLoop` itself went from ~1078 lines to a ~50-line pipeline skeleton that calls these in sequence and handles the discriminated union returns.

Three types were added to capture state that was previously implicit: `PhaseResult<T>`, `IterationContext` (per-iteration read-only inputs), and `LoopState` (mutable cross-iteration state like `recentUnits` and `stuckRecoveryAttempts`).

1060 additions, 920 deletions. Net +140 — the new type definitions and cleaner interfaces.

### 5. Module split (#1682, open)

With the phases extracted, `auto-loop.ts` still had everything in one file. The final step splits it into 7 modules under `auto/`:

```
auto/types.ts          Constants + all shared types
auto/resolve.ts        Mutable resolve state + public resolve API
auto/detect-stuck.ts   detectStuck() (leaf)
auto/loop-deps.ts      LoopDeps interface (leaf, type-only)
auto/run-unit.ts       runUnit()
auto/phases.ts         All 5 pipeline phases + helpers
auto/loop.ts           autoLoop()
auto-loop.ts           ~16-line barrel re-export (unchanged public API)
```

The import DAG is acyclic. `types.ts`, `detect-stuck.ts`, and `loop-deps.ts` are leaves with no internal deps. Everything flows toward `loop.ts`. No cycles, no surprises.

External consumers — `auto.ts`, `auto-timeout-recovery.ts`, tests — import from `auto-loop.ts` and see nothing change. The barrel handles it.

1826/1826 unit tests pass.

## What the sequence looks like in git

```
fix code smells            ← no structure changes
fix mechanical issues      ← no structure changes
add behavioral tests       ← lock contracts before restructure
extract pipeline phases    ← structural change, tests already green
split into modules         ← structural change, DAG is clean
```

Each PR is reviewable in isolation. None of them require understanding the whole sequence to approve. That's not an accident — it's the only way to get structural refactors merged in an active codebase.

## The result

A function that required reading 1000+ lines to safely modify is now five named phases, each under 320 lines, with explicit inputs and discriminated union outputs. The module boundaries match what the ASCII separators were already trying to say.

Sometimes the best refactoring is just making the structure the code already implied.
