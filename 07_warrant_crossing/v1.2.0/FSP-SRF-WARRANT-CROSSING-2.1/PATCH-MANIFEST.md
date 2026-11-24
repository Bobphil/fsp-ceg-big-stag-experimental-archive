# PATCH MANIFEST — 2.0 → 2.1

## State schema additions
- `provenance_status`
- `warrant_commitment`
- `standing.claims[]`
- `standing.resolution`
- `residue_registry[]`
- `reopen_triggers[]`
- `reopen_resolution`
- coalition `governance.delegations[]`
- coalition `failures[]`

## New canonical events
- `VERIFY_PROVENANCE`
- `ATTEST_WARRANT`
- `CHECK_WARRANT_COMMITMENT`
- `SET_STANDING_CLAIM`
- `RESOLVE_STANDING`
- `ADD_REOPEN_TRIGGER`
- `RESOLVE_REOPEN`

## Tightened canonical events
- `ADD_ALTERNATIVE_WARRANT`
- `AUTHORIZE`
- `PRESERVE_RESIDUE`
- `REOPEN`
- `FINALIZE_X7`
- coalition `recomputeCoalition`

## New failure codes
- `WC-F13` — unresolved/conflicting standing
- `WC-F14` — provenance/commitment failure
- `WC-F15` — unauthorized coalition recomposition
- `WC-F16` — stale/untyped residue
- `WC-F17` — competing/unresolved REOPEN trigger scope
- `WC-F18` — broad REOPEN without dependency evidence
