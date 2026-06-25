---
title: "The spec should pick the test, not you"
date: "2026-06-20"
---

The [last post](/articles/make-the-spec-break) ended on a rule: a test that can't fail is a wish, so write the failing case first. True, and incomplete. Because you still wrote that test *by hand* — you, a human, decided it should be a runtime assertion that fires on bad input. For "no account goes negative," that's right. For "transfers conserve money," writing it by hand is how you produce a test that's green forever and proves nothing. The decision of *what kind of test a claim needs* is itself error-prone, and right now you're the one making it. That's the bug this post is about.

The fix: don't write the spec as prose and the tests as code. Write **one** artifact — a typed record of obligations — and *project* everything else out of it. The prose is a view. The tests are derived. The coverage report is computed. And one field in that record decides, mechanically, whether a claim even *can* be tested at runtime.

## One source a human writes

Here's a ledger spec. Not Markdown — an IR. This is the only file a person edits:

```toml
[[obligation]]
id        = "LEDGER-NONNEG"
title     = "No account goes negative"
statement = "a debit exceeding the available balance is rejected; balance unchanged"
positive  = "debit 30 against balance 50 → balance 20"
negative  = "debit 80 against balance 50 → rejected, balance still 50"
representability = "constructible"        # you can build the bad input → a runtime check fires
diagnostic       = "INSUFFICIENT_FUNDS"   # must name the account + the shortfall

[[obligation]]
id        = "LEDGER-CONSERVE"
title     = "Transfers conserve total money"
statement = "a transfer never changes the sum of all balances"
positive  = "transfer 30 A→B → A−30, B+30, total unchanged"
negative  = "a transfer whose credit leg ≠ its debit leg"
representability = "by-construction"      # ⇐ the load-bearing field
proof     = "a Transfer carries ONE amount, applied as −amount to src and +amount to dst; unequal legs cannot be expressed in the type"
diagnostic = "none"                       # forced null: there is no runtime check to write

[[obligation]]
id        = "LEDGER-IDEMPOTENT"
title     = "Replays apply once"
statement = "two transfers sharing an idempotency key apply the effect at most once"
positive  = "key 'k1' submitted twice → balances move once"
negative  = "—"                           # the duplicate is absorbed, not an error
representability = "constructible"
diagnostic = "none"                       # silent dedup, asserted by the positive
```

Three obligations, three values of one field, and that field is the whole essay.

## representability decides the test

Look at what `representability` forces, per obligation, with no human in the loop:

- **`constructible`** (NONNEG) — you can build the bad input, so a runtime check must fire. The negative is a real runtime test, and `diagnostic` is non-null: the check has to name the account and the shortfall, or it's useless.
- **`by-construction`** (CONSERVE) — the bad input *cannot be expressed in the type*. A `Transfer` carries one amount, applied as ∓ to its two legs; an unequal-leg transfer is unspellable. So there is no runtime check to write — `diagnostic` is forced to `none` — and the negative test is not "assert money wasn't created," it's "prove an unequal-leg transfer **doesn't compile**."
- **`constructible` + silent** (IDEMPOTENT) — buildable, but the duplicate is absorbed, not rejected. No diagnostic, no negative; the positive ("submitted twice → moves once") carries the whole claim.

Now project. The prose spec is a render — never hand-edited:

```
## Ledger guarantees
- LEDGER-NONNEG — A debit exceeding the balance is rejected, balance unchanged
  (debit 80 of 50 → INSUFFICIENT_FUNDS, naming the account and shortfall).
- LEDGER-CONSERVE — Holds *by construction*: a transfer carries one amount applied
  as ∓ to its two legs, so an unequal transfer cannot be expressed. No runtime
  check exists or is needed.
- LEDGER-IDEMPOTENT — Two transfers with the same key move the balances once.
```

The required tests are *derived*, not authored:

```
LEDGER-NONNEG     ⇒ positive: debit 30/bal 50 → 20
                    negative: debit 80/bal 50 → INSUFFICIENT_FUNDS, bal 50
LEDGER-CONSERVE   ⇒ a BOUNDARY/TYPE test that an unequal-leg transfer does NOT
                    typecheck — NOT a runtime "money created" assertion
LEDGER-IDEMPOTENT ⇒ replay key k1 twice → effect applied once
```

And the coverage setpoint is computed live, against the actual test suite:

```
LEDGER-NONNEG      ✅ covered   (2 green scenarios)
LEDGER-CONSERVE    🔴 RED       owes: a compile-fail test for unequal legs
LEDGER-IDEMPOTENT  ✅ covered
                   ──────────────
error set = { LEDGER-CONSERVE }   ← the loop reconciles exactly this, nothing else
```

## The hollow test the schema won't let you write

Here is the move, and it's worth slowing down for. Hand a human "transfers conserve total money" and tell them to write a test. They write the obvious one: *do a transfer, assert the sum of balances is unchanged.* It passes. It will pass forever. It proves **nothing** — because if your `Transfer` type already carries a single amount, conservation was never in danger, and the test exercises a property the type already guarantees. It's a green light wired to nothing. The worst kind, because it *looks* like coverage.

`representability = "by-construction"` deletes that test and writes the right one instead. It nulls the diagnostic so you don't author a check that can't exist. It rewrites the required test from the hollow runtime assertion into "prove the bad value doesn't compile." And it makes the prose say "by construction" instead of inventing a guard. A human falls into the hollow test almost every time and never notices. The schema can't fall in — there's no field where the hollow test fits.

That's "make illegal states unrepresentable," the oldest good idea in typed programming, turned around and aimed at the *spec itself*. You don't just make bad program states unspellable. You make the bad *test* unspellable.

## Where it stops — and it does stop

The honest part, because a field that does this much invites overclaiming, and the whole series is about not doing that.

**`by-construction` is scoped, not free.** CONSERVE's proof conserves money across the `Transfer` path only. Add a `mint` operation with no matching debit and conservation dies, and the type proves nothing about it. The honest claim is "*transfers* conserve," not "money is conserved." The field tells you whether a runtime check is needed; it does not verify that your by-construction proof actually covers the property you wrote in the `statement`. That gap is yours.

**The schema can't catch an obligation you under-specified.** IDEMPOTENT says `negative = "—"`, duplicate absorbed. But same key with a *different amount* — absorbed, or a conflict? Real idempotency keys reject a payload mismatch. There's a missing negative there, and **no field in the record will ever surface it**, because the record faithfully encodes the claim you made, and the claim was incomplete. `representability` mechanizes *what kind* of test each obligation needs. It cannot mechanize *did you write down every obligation, and every negative of each*. That stays human — the same place the loop always hands back to you, the same "fidelity is not mechanizable" wall from the [first post](/articles/confident-markdown). The schema moved the wall. It didn't remove it.

## This is a design, not a running system

Straight, because the blog rule is that what doesn't work is reported as plainly as what does: I have not built this. In `wir` — the workflow-IR compiler this all comes out of — it's specced as a chain of tasks, all currently open: a single source of truth for obligations (spb.1), deriving the conformance-test map from them (spb.2), the typed position-stable schema itself (spb.4), a consistency linter that fails CI on prose↔code drift (spb.5), and the live coverage sensor that computes the error set (0n8.1). None of it is green yet. The ledger above is how I'm reasoning about the shape before committing it to types — which is the entire point of having a source you can think in.

So the trilogy, end to end: you need a gate independent of the thing that did the work; the gate for a flat claim is an executable acceptance criterion you can watch break; and the kind of break each claim needs is not yours to guess — it's a field on the obligation, and the spec should hand you the test. The day the schema writes the hollow test for me is the day I'll have got it wrong. Until then, it refuses to let me.
