---
title: "An acceptance criterion that can't fail is just a wish"
date: "2026-06-20"
---

[Last time](/articles/confident-markdown) I argued that an unverified spec is confident markdown, and ended on a slogan: *make the spec break.* A slogan is not a mechanism. This is the mechanism.

The previous piece showed a model checker proving a *design* — the agent loop, with the agent modeled as an adversary that returns the worst possible thing. That machine is correct and it is also expensive, and most of what's in a real spec doesn't need it. A spec is mostly not temporal claims about interleavings. It's a pile of flat assertions: *this field must be present, that reference must resolve, this output must be byte-identical on a second run.* Predicates over one value. You don't model-check those. You need a cheaper machine that runs against every one of them, and you need it to fail loudly.

That machine is the executable acceptance criterion. Here is the law it runs on:

**An acceptance criterion that cannot fail is not a criterion. It's a wish.**

Your job, writing a spec, is not to describe what correct looks like. It's to name, for every claim, the concrete execution that turns it *red*. If you can't write the thing that fails, you don't understand the claim yet — and no amount of confident prose will fix that, it'll only hide it.

## One sentence, then teeth

Here is a requirement from a compiler I'm building. It's one row in a table of validator rules — the entire obligation, in the form the spec states it:

```
| R-VERSION | IR carries a known schema version. | Check version field against supported range. | State found vs. supported version range. |
```

In the standard "specs are the new code" pitch, that sentence sits there asserting itself, and you *hope* the implementation honors it. The sentence has no mechanism for being wrong. That's the whole problem with prose: code at least segfaults; a sentence just sits there, smug.

Now watch what it compiles into. This is the top of `version.feature` — the requirement restated, verbatim, no longer as a wish:

```gherkin
Feature: R-VERSION — the IR carries a known ir_version
  The IR carries an explicit `ir_version`; breaking changes bump it and the
  validator rejects versions it does not understand. ... `ir_version` is a bare
  `u32` with no DSL provenance, so the diagnostic carries no span.

  Scenario: A workflow stamped with the supported ir_version yields no diagnostic
    Given a workflow stamped with the supported ir_version
    When I check R-VERSION
    Then R-VERSION reports 0 diagnostics

  Scenario: An ir_version below the supported version fires R-VERSION
    Given a workflow stamped with ir_version 0
    When I check R-VERSION
    Then R-VERSION reports 1 diagnostics
    And the R-VERSION diagnostic states found 0 and the supported version, with no span

  Scenario: An ir_version above the supported version fires R-VERSION
    Given a workflow stamped with ir_version 2
    When I check R-VERSION
    Then R-VERSION reports 1 diagnostics
    And the R-VERSION diagnostic states found 2 and the supported version, with no span
```

The thing people miss: **the spec prose and the test are the same file.** That description block isn't a paraphrase of the requirement that can drift from it — it *is* the requirement, with executable assertions bolted to every clause. "Carries no span" stopped being English the moment it became `with no span` — an assertion that fails the build if a span ever leaks in.

And it fails *closed*. These cucumber harnesses are custom (`harness = false`) driven by `run_and_exit`, so a failing scenario fails the process with a nonzero exit. There is no "the model read it and it looks fine." A `u32` goes in; an exit code comes out. Confident markdown became a thing that has to survive an execution.

## Write the failing case first

Look at the coverage shape above. Not one test — three. Zero (passes clean), then *both* failure directions: below the supported version and above it. Two counts as many. A rule that only checks one side of a boundary is a rule you can fool, and a green suite full of one-sided checks is a false-green generator that reads like rigor.

This is a hard line in the spec itself — call it AC-7:

```
| AC-7 | Validator coverage: each rule has at least one positive and one negative test. |
```

The negative case is the load-bearing one, and it has to come *first*, before the implementation exists. A test that goes green the moment you write it has proven nothing — it might be green because the behavior works, or green because it never fires. The only way to know the difference is to run the negative case against the *unmodified* code and watch it go **red**, then make it green. That's mutation testing shrunk down to a single assertion: prove the gate can bite before you trust the bite. A positive-only test is decoration. A negative test you never saw fail is decoration you haven't noticed yet.

## When the artifact is code, lint won't save you

R-VERSION's oracle is a diagnostic count — cheap. Some claims are harder. One of mine says the compiler's output is *valid, runnable workflow JavaScript*. You cannot settle that with a string match or a linter. The only honest oracle for "this code runs" is to run it.

So there's a gate that boots a faithful stub of the actual runtime and executes every generated script inside a sandbox:

```
- injected globals: agent, parallel, pipeline, phase, log, args, budget, workflow
- banned APIs (Date.now / Math.random) throw, exactly like the real engine
- agent() returns schema-conformant dummy data so control flow actually runs
- a per-script call cap + wall-clock timeout flag non-terminating scripts (RUNAWAY)
```

The banned calls throw the same way production throws. The control flow runs to completion or trips the runaway cap. "The output is valid" became an execution that fails closed, not a sentence you trusted. The claim and the thing that kills the claim ship together.

## The gate lies too

Here's the part that separates a real falsification harness from theater: the gate has its own failure modes, and both of them are *false greens* — the catastrophic direction, the one that ships the bug while every check smiles.

**The harness can skip and call it pass.** Run these `harness = false` suites under a parallel test runner that doesn't understand custom harnesses, and it reports `0 scenarios` — green, shipped, broken. The fix isn't subtle: never use that runner, and after every run confirm the summary says `N scenarios (N passed)`, never `0 scenarios`. A falsification harness you didn't confirm actually *ran* is confident markdown wearing a CI badge. Same lie, one level up.

**The model can grade its own homework.** The seductive shortcut is LLM-as-judge: "ask the model whether the code matches the spec." Think about what that is — confident prose checking confident prose, the same failure mode on both sides of the gate, guaranteed to agree with itself. The model may *write* the spec. It may *write* the harness. It may *fix* what the harness catches. It must never *be* the harness, or you've just relocated the smug sentence up a level and called it verification. This is the same theorem the last post's model checker derived on its own: the thing that checks the work must be independent of the thing that did it.

## What this buys, and what it doesn't

Be honest about the ceiling. A real gate does not make your spec *correct*, any more than `rustc` makes your program correct. It makes the spec **well-formed, internally consistent, unambiguous, and falsifiable** — and that is enormous, because it's exactly the four things prose gives you for free as illusions. Correctness still comes from the tests actually biting and, for the temporal claims, the model checker actually finding the counterexample. The gate is necessary, not sufficient. "Specs are the new code" is true *only* for specs you can watch break.

The one thing that stays unmechanized is whether the spec says what you actually wanted — fidelity, intent. That's supposed to be the only place a human is still required. Everything else on the page should be answerable by something that isn't another confident reader.

## Make the discipline an agent

A discipline that lives in my head dies when I'm not the one writing the spec — and increasingly I'm not; an agent is. So I wrote it down as a playbook, built to drive a spec-writer agent whose whole job is acceptance criteria that ship their own falsifier. The procedure is mechanical on purpose:

1. Extract the obligations. One claim per criterion — if it says "and," split it, because a compound criterion hides which half broke.
2. Name the oracle before the test. The deterministic thing that decides true or false. No oracle exists? That's the finding — build one or mark the claim unverifiable. Don't paper over it.
3. Write the *negative* case first, and predict the exact observable — not "it errors" but "one diagnostic, this code, no span."
4. Write the positive case second. It's the easy one. That's why it's not first.
5. Wire failure to a nonzero exit.
6. Prove it bites — red before the fix, green after.
7. Confirm the harness ran. Count the scenarios.

Banned, on sight: `should`, `properly`, `correctly`, `handles gracefully` — every weasel word is an unfalsifiable claim wearing a lab coat. "Tests pass" is not a criterion; which tests, and did they run? And the model is never the oracle.

That's the answer to the slogan. You make a spec break by writing, next to every confident sentence, the execution that ends in a nonzero exit code — and then watching it actually fail before you let it pass. A spec whose every clause has survived a real attempt to break it is the new code. A spec you can't watch lose is still just a wish.
