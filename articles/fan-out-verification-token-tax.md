---
title: "Five verifier agents found nothing one agent missed"
date: "2026-06-18"
---

The pitch for "loop engineering" in 2026 is that a single agent is not enough. You wrap it in a verifier; you fan the verifier out into a panel of specialists; each one runs in its own context window and argues against the others. Claude Code now ships a [dynamic-workflows tool](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code) that lets Claude write its own JavaScript orchestration harness to do exactly this — spawn N sub-agents, give each a narrow job, merge the results. The motivating claim is that one context window suffers from *agentic laziness* (checks 20 of 50 items and declares victory), *self-preferential bias* (grades its own work generously), and *goal drift* (loses the thread after compaction). Separate agents with isolated goals are supposed to fix all three.

It is a good story. I wanted a number.

So I ran the smallest honest version of the experiment: a single Claude with the full checklist, versus five Claudes each holding one fifth of it, auditing the same corpus for the same planted bugs. Same model, same instructions, same files. The only variable was whether the checklist lived in one head or five.

**Both found all nine bugs. The five-agent version cost 1.94× the tokens and produced more false positives.**

## The setup

I keep a small Markdown knowledge-base — `sources/`, `experiments/`, `findings/`, cross-linked, with a tiny `lint`/`verify` CLI that checks the links resolve and runs an executable `check:` line on each finding. It's a good audit target because "correct" is well-defined.

I built a self-contained fixture version of it: three sources, four experiments, seven findings, plus its own copy of the CLI so the linter audits the *fixture*, not the real notebook. Then I planted nine defects and five clean documents as distractors. The defects came in two tiers.

**Mechanical** (the linter catches these):

- a `derived-from:` pointing at an experiment that doesn't exist;
- a finding with an empty `check:` field;
- an experiment that distills no finding.

**Semantic** (no linter can see these — they need judgment):

- a finding stamped `scope: general` from a single benchmark on a single machine;
- `confidence: high` on a result the experiment itself calls "suggestive, n=1, not replicated";
- a source summary claiming the article found mmap "5× faster, recommend it unconditionally" when the cached raw text says mmap was 1.8× *slower* on small files and calls reaching for it a cargo-cult;
- an interpretation sentence smuggled into a `## Raw results` section that's supposed to hold verbatim numbers only;
- two findings asserting flatly contradictory claims, neither marked as superseding the other;
- and my favourite, a finding whose `check:` is `test 1 = 1`.

That last one is the whole thesis in miniature. It exits 0. The `verify` command reports **PASS**. The dashboard is green. It validates nothing. Before a single agent ran, the linter already demonstrated the problem the verifier is supposed to solve:

```
$ verify
  PASS  warm-cache-removes-io-wait      ← check is `test 1 = 1`
  PASS  mmap-beats-read-on-large-files
  SKIP  ...
exit 0
```

Nine bugs in the notebook, every gate smiling. The six semantic ones are invisible to the tools. Catching them is a reading-and-judgment job, which is what the verifier debate is actually about.

The ground-truth list of the nine defects lived *outside* the fixture, so no auditor agent could read the answer key.

## The two harnesses

Both arms received the identical taxonomy — the same nine invariants, the same tactical hints ("run the linter", "diff each summary against its raw cache", "open each `check:` and ask whether a PASS would actually mean the claim holds"). The only difference was the partition:

- **Arm A — one context.** A single agent, the whole nine-item checklist, told to read every file and report every violation.
- **Arm B — five contexts.** Five agents in parallel, one lens each (structure / evidence-calibration / source-fidelity / check-honesty / contradictions-and-raw-discipline), each told to assume violations exist and hunt them. Their findings unioned by a deterministic code merge — no LLM in the merge, so the fan-out's recall couldn't be sandbagged by a lazy synthesis step.

Six agents total, 165 seconds, ~208k tokens of sub-agent work.

## The result

```
ID  tier        invariant   linter?  Arm A   Arm B
D1  mechanical  dangling    yes       HIT     HIT
D2  mechanical  no check    yes       HIT     HIT
D3  mechanical  orphan      yes       HIT     HIT
D4  semantic    over-scope  no        HIT     HIT
D5  semantic    confidence  no        HIT     HIT
D6  semantic    false-green no        HIT     HIT
D7  semantic    inverted    no        HIT     HIT
D8  semantic    raw bleed   no        HIT     HIT
D9  semantic    contradict  no        HIT     HIT
```

| | Arm A (one context) | Arm B (five agents) |
|---|---|---|
| reports emitted | 12 | 19 |
| **recall** | **9/9** | **9/9** |
| recall, semantic tier | 6/6 | 6/6 |
| false positives | 1 | 2 |
| output tokens | 10,734 | 20,854 (**1.94×**) |

One context, on its own, caught the false-green check, the inverted source summary, and the unmarked contradiction — every semantic bug the tooling is blind to. The five-agent panel caught the same nine and not one more. For the privilege it spent roughly double the tokens and emitted an extra false positive: its check-honesty specialist, pressing its narrow concern harder than any generalist would, flagged a *clean* finding's grep-based check as "too weak" because it matched prose rather than the raw numbers. Defensible. Also noise. More eyes, more flags, no more bugs.

## Why the swarm didn't win

Not because fan-out is useless. Because the failure modes it exists to fight didn't fire.

Laziness, bias, and drift are pathologies of *scale* — long tasks, big surfaces, context lost to compaction. A 16-document fixture with a 9-item checklist handed to a strong model is the small, well-specified regime where one context simply doesn't get lazy. It had room to hold the whole job in its head, so it did, and the partition bought nothing.

This is not a contrarian finding. It is what the Anthropic post itself says, buried under the patterns: *"most traditional coding tasks do not need a panel of 5 reviewers."* The verifier mattered — the semantic gate caught six bugs the linter couldn't. *Distributing* the verifier is what didn't matter. The thing everyone is excited about (the swarm) was the part that added cost without value; the thing nobody specifies (the rubric the verifier checks against) was carrying the entire result.

## The honest caveats

This is one run on one fixture. It is not a refutation of multi-agent verification; it is a measurement of where the crossover *isn't*.

- **n = 1.** One corpus, one run per arm. The 12-vs-19 report counts and the false-positive numbers would wobble on a rerun. The *parity* — both 9/9 — is the robust signal; the precise deltas are not.
- **I planted the bugs.** Hand-seeded defects are sharper than ones that grow in the wild. Subtler defects would lower both arms' recall and might open a gap. I also wrote the lens taxonomy, which is a circularity risk — mitigated by giving both arms identical guidance, not eliminated.
- **The model is strong.** Opus with a short checklist is the best case for one context. A weaker model, or a checklist long enough to overflow attention, is precisely where fan-out is theorised to win.

Which points at the experiment actually worth running: scale the corpus to hundreds of documents, lengthen the checklist, or weaken the model until the single context starts dropping items — and find the size at which the swarm finally earns its tokens. That crossover is the number that tells you *when* to reach for the expensive tool. I don't have it yet.

## What I'd take from this

If you're auditing something small and well-scoped, don't reach for a five-agent panel by reflex. It roughly doubles the bill and adds false-positive noise for no recall you couldn't get from one careful pass. Spend the budget on the *gate* — the rubric, the executable check, the thing that defines what "wrong" means — not on parallelising it.

And check your checks. `test 1 = 1` passes.
