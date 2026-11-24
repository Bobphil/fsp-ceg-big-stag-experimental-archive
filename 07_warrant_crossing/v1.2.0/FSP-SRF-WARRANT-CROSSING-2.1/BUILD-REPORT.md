# FSP-SRF-WARRANT-CROSSING-2.1 — Build Report

Status: **EXECUTABLE HARDENING PASS**

## Lineage
- `FSP-SRF-WARRANT-CROSSING-1` — architecture specification
- `FSP-SRF-WARRANT-CROSSING-2` — executable reducer and baseline harness
- `FSP-SRF-WARRANT-CROSSING-STRESS-1` — adversarial attack harness
- `FSP-SRF-WARRANT-CROSSING-2.1` — canonical adversarial hardening patch

## Stress findings promoted into core

| Stress finding | Canonical 2.1 response |
|---|---|
| Ambiguous / thin alternative warrants | Bounded typed alternative-warrant validation |
| Conflicting standing | Standing claim set + contested state + governed resolution |
| Strategic misrepresentation | Provenance verification + optional SHA-256 warrant commitment |
| Coalition capture | Actor identity + delegation-scoped cross-member update |
| Stale residue | Version/freshness registry; only `current` residue is preservable |
| Competing REOPEN triggers | Trigger records + arbitration object + selected target enforcement |
| Broad-REOPEN audit gap | `OP-REOPEN` now records `broad`, dependency evidence, and arbitration |

## Test result
Fresh local run on 24 Nov 2026:
- core suite: **25/25 PASS**
- hardening suite: **15/15 PASS**
- combined: **40/40 PASS**

The first 2.1 test run produced 36/40 because four inherited tests still encoded 2.0 semantics. Those tests were revised to the new contract rather than weakening the reducer. The final fresh run is 40/40.

## New/expanded invariants
The record invariant set is now I1–I16. The additions enforce verified provenance at authorization, current/versioned residue, and arbitration of competing REOPEN triggers. Coalition multiplicity remains separately checked.

## Scope
This is a deterministic executable architecture test. PASS means the reducer behaves according to the frozen hardening rules on the included fixtures. It is not evidence that these rules are exhaustive or optimal in real institutions.
