---
title: "An unverified spec is just confident markdown"
date: "2026-06-20"
---

"Specs are the new code" is having its moment. Sean Grove's [*The New Code*](https://www.youtube.com/watch?v=8rABwKRsec4) makes the clean version of the argument: code is a lossy projection of intent, the prompt is the source and the binary is disposable, so you should version-control the spec and regenerate the code. He's right. Every coding agent is already a spec compiler whether it admits it or not.

There's a hole in the analogy, and it's the load-bearing half.

## A compiler can't lie. An agent can.

`gcc` is correct-by-construction and total: same input, same output, defined behavior on every program. An AI agent compiling a spec is neither. It is nondeterministic, and it can fail — or worse, *appear* to succeed. It will hand you plausible, well-structured, confidently-wrong code and a green checkmark.

So spec compilation needs something `gcc` never did: an external check that can fail loudly. A compiler doesn't need a test suite to prove it compiled your program correctly. An agent does — because the agent is the part that might be wrong, and it is also the part writing the "it works" report.

Almost every spec tool I've looked at skips this. There's a TLA+ plugin that generates specifications and model configs through slash commands and never once runs the model checker. Its "review" command is the model grading its own homework. A spec you generate and never verify is just confident markdown. It reads like rigor. It isn't.

## Spec the thing you trust least

The honest test of this is to point it at the loop itself — the agent that picks work, implements it, verifies it, and marks it done. That's where a false green actually ships.

You can't write a formal spec of the agent. It's a stochastic oracle, not a state machine; "the model will produce correct code" is not a property you can state. So you don't spec the agent. You spec the *harness*, and you model the agent as an adversary that may return anything — including the plausible lie.

Here is the whole thing in TLA+. `correct` is the hidden ground truth — did the implementation actually satisfy the spec. `evidence` is what the verifier *reports*, which may not match. The two judges are the only difference that matters:

```tla
\* (A) trusts the verifier's report
JudgeNaive == /\ phase = "verified"
              /\ phase' = (IF evidence = "green" THEN "closed" ELSE "claimed")

\* (B) reads the work itself — observes ground truth, not the report
JudgeIndep == /\ phase = "verified"
              /\ phase' = (IF correct THEN "closed"
                           ELSE IF attempts >= MaxAttempts THEN "escalated"
                           ELSE "claimed")
```

One safety property: **a task is never marked done while it is actually broken.**

```tla
NoFalseGreen == (phase = "closed") => correct
```

The agent's `Implement` action sets `correct` to `TRUE` or `FALSE` nondeterministically. `Verify` sets `evidence` to `green` or `red` nondeterministically — it can report green on broken code. The model checker explores every branch, including the worst one. The whole module is about forty lines and runs in two seconds.

Run it two ways. Same spec, one line changed.

**Judge trusts the verifier's report.** TLC hands you a counterexample in five states:

```
State 1  phase = "ready"        correct = FALSE  evidence = "none"
State 2  phase = "claimed"
State 3  phase = "implemented"  correct = FALSE              (agent wrote a bug)
State 4  phase = "verified"     correct = FALSE  evidence = "green"   (a false green)
State 5  phase = "closed"       correct = FALSE
         ⇒ Invariant NoFalseGreen is violated.
```

The agent wrote broken code, the verifier reported green, the judge closed on it. A false green, shipped — found by exhaustive search, not by hoping.

**Judge reads the work itself.** Now the close is gated on `correct`, not on a report. TLC: *No error has been found* — across all 24 reachable states, every adversarial branch, the agent returning the worst possible thing at every step.

The delta between those two runs is one line, and that line is the entire argument: **the thing that checks the work has to be independent of the thing that did it.** I didn't tell the model checker that. It derived it. "Don't trust the generated 'it works'" stops being a habit and becomes a theorem.

It proves the other half too. The liveness property isn't "the task eventually gets done" — the agent might never get it right. It's "the loop eventually *stops*: closes or escalates." You don't promise to win. You promise to halt, cap the retries, and hand a stuck task to a human. That's also forced by the model, not by discipline.

## Type errors become truth errors

When the compiler is an agent reading prose, the bugs move. A miscompile is no longer a type error — it is one false line in the spec that the agent faithfully implemented. Debugging becomes archaeology through the markdown, not the stack trace.

This is not hypothetical. I have a requirements document that still describes a validation rule as "a structural check on the stage's parameter list" — months after the types were changed to make that parameter list unsettable, so the check it describes can no longer exist. The prose is a *truth error*. An agent reading it will build toward a check that can't be built, confidently, and the tests it writes will assert a thing that never fires. Nothing in the type system catches it, because the lie is in the English.

Split "truth" in two. **Consistency** — does the spec contradict itself, its types, its other clauses? — is mechanizable. That is what a model checker does for a design, and what a linter could do for prose. Grove describes exactly this: a type checker for specifications that blocks publication when one team's spec conflicts with another's. **Fidelity** — does the spec say what you actually wanted? — is not. `gcc` never checked whether your comment lied; no tool checks whether your requirement lied. That one stays human.

## The skill is layer diagnosis

So when something is red, the first move is not to fix it. It is to decide *which layer is wrong*:

- **Code** — the agent miscompiled a correct spec. Re-run, maybe with a better model.
- **Spec** — the agent correctly implemented a wrong spec. Fix it *upstream* and recompile.
- **Intent** — the spec faithfully captures something you didn't actually want. Only you can catch this.

Same symptom — red tests, broken behavior — three fixes, in opposite directions. The expensive mistake, the one that corrupts everything downstream, is patching the *code* to satisfy a *wrong spec*. Now you have bent the artifact to match the lie, and the lie is still in the source.

This is the new step debugger. The old one: breakpoint in the code, find the bug, change the code, restart the process. The new one: watch the agent implement the plan, realize the error is in the *plan*, go upstream, fix the spec, restart the *implementation*.

## Make the spec break

Specs are the new code. Then the gate is the new compiler — the part that turns confident markdown into something you can trust.

You can mechanize every kind of wrong except one. Code bugs: a verifier that reads the work, not the report. Design contradictions: a model checker. Prose drift: a consistency linter. The only thing left unmechanized is "wrong about what you wanted," and that is supposed to be empty. That is where you stay in the loop.

Grove's talk says make the spec executable, test against the spec. It never shows a spec *failing* a test. That is the gap in every spec-as-code pitch I have seen, and it is the whole game. A spec you cannot watch break is confident markdown.

Make the spec break.
