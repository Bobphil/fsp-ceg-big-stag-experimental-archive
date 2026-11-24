# FSP-SRF-WARRANT-CROSSING-STRESS-1

## Adversarial Crossing Stress Build

This package attacks the executable `FSP-SRF-WARRANT-CROSSING-2` reducer with ambiguous warrants, conflicting standing, strategic misrepresentation, coalition capture, stale residue, and competing REOPEN triggers.

The inherited baseline implementation is preserved in `src/reducer.js`, `src/invariants.js`, and `src/coalition.js`. The stress build adds a separate hardened layer in `src/stress.js` and `src/coalition_hardened.js` so baseline behavior remains inspectable.

### Fresh verification

- inherited baseline tests: **25/25 PASS**
- adversarial tests: **15/15 PASS**
- combined suite: **40/40 PASS**
- Node.js: **v22.16.0**
- npm: **10.9.2**

Run:

```bash
npm test
npm run test:baseline
npm run test:adversarial
```

## Stress findings

| Code | Attack family | Baseline exposure | Hardened response |
|---|---|---|---|
| WC-STRESS-F01 | Ambiguous warrant | Alternative warrant is typed supported if `support` is merely nonempty | Require id, bounded scope, claim link, qualifier, substantive text, and typed receiver-side support |
| WC-STRESS-F02 | Conflicting standing | Scalar standing can be overwritten; historical X5 pass may coexist with later failed standing | Preserve standing claims as plural records; conflict becomes `contested`; X5 waits for governed resolution |
| WC-STRESS-F03 | Strategic misrepresentation | Provenance need only be present, not verified; nested warrant mutation has no commitment check | Verify provenance before authorization and hash the full nested warrant/provenance record |
| WC-STRESS-F04 | Coalition capture | One recomposition update can rewrite another member's action support | Require actor identity and self-update or explicit delegation |
| WC-STRESS-F05 | Stale residue | Any residue object can count as preserved regardless of freshness | Require version, recorded time, and current/superseded/expired status; only current residue enters active reserve |
| WC-STRESS-F06 | Competing REOPEN | No first-class representation of competing/incompatible triggers | Record triggers, incompatibility groups, and governed resolution before reopening |
| WC-STRESS-F07 | Broad REOPEN audit gap | Legal broad REOPEN does not preserve `broad` in the operator audit record | Stress layer detects the missing scope-expansion trace; baseline reducer requires a future patch |

## Interpretation

A stress-test PASS does not mean every adversarial condition is harmless. It means the harness correctly distinguishes:

1. baseline vulnerabilities that are reproducibly exposed;
2. hardened controls that contain the attack;
3. inherited behavior that remains regression-safe; and
4. unresolved design gaps requiring a future core patch.

The broad-REOPEN audit gap remains intentionally visible rather than silently rewritten in the inherited reducer.

## Claim ceiling

**Adversarial containment in synthetic fixtures ≠ security proof ≠ empirical institutional robustness ≠ normative legitimacy.**
