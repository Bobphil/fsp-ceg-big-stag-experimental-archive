# FSP-SRF-WARRANT-CROSSING-STRESS-1 — Build Report

## Verdict

**ADVERSARIAL STRESS PASS / CORE PATCHES INDICATED**

The inherited `WARRANT-CROSSING-2` suite remains 25/25 PASS. Fifteen additional adversarial tests pass, for 40/40 combined.

## What the stress build discovered

### 1. Ambiguous warrant bridge
The baseline `ADD_ALTERNATIVE_WARRANT` treats a warrant as supported whenever the `support` array is nonempty. It does not require a bounded scope, explicit claim linkage, qualifier, or typed provenance. This allows a thin receiver-side bridge to support X4 after X3 rejection.

**Hardening:** structured alternative warrants are now required by the stress layer.

### 2. Conflicting standing
Standing is stored as one scalar state. A later contradictory `SET_STANDING` overwrites current standing while the historical `passed.X5` flag remains true. This creates a split between historical passage and present qualification.

**Hardening:** plural standing claims are retained; disagreement yields `contested`; resolution requires a named procedure and resolver basis.

### 3. Strategic misrepresentation
The baseline checks whether provenance exists, not whether it is verified. It also lacks a commitment over the complete nested warrant structure.

**Hardening:** authorization is blocked until provenance verification, and warrant/provenance state can be cryptographically committed and rechecked.

A harness defect initially failed to detect nested mutation because the first hash canonicalizer was shallow. The canonicalizer was replaced with recursive key ordering, after which the adversarial mutation test passed. This is recorded as a stress-harness correction, not a baseline reducer failure.

### 4. Coalition capture
The baseline coalition reducer accepts a single update object that can change another member's action support without identifying who made the update.

**Hardening:** every recomposition has an actor; cross-member modification requires explicit delegation.

### 5. Stale residue
The baseline Corrigibility Reserve has no freshness/version semantics. A superseded item can remain formally preserved and may later support X7.

**Hardening:** residue receives id, version, recorded time, and status; superseded or expired residue remains historically visible but does not count as current recovery substrate.

### 6. Competing REOPEN triggers
The baseline stores `reopen_targets` only after routing/reopening and has no first-class trigger competition model.

**Hardening:** triggers are recorded independently, incompatible trigger groups create a conflict, and REOPEN is blocked until a valid resolution procedure selects targets.

### 7. Broad REOPEN audit gap
The baseline reducer correctly requires dependency evidence for `broad:true`, but `OP-REOPEN` records only targets and omits the `broad` flag. Therefore the operator audit trail cannot later distinguish a selective REOPEN from a dependency-licensed broad REOPEN.

**Status:** reproducibly exposed; intentionally not silently patched in the inherited core.

## New adversarial firewalls

- Nonempty support ≠ adequately specified alternative warrant.
- Prior standing pass ≠ current uncontested standing.
- Present provenance ≠ verified provenance.
- Coalition update ≠ authority to rewrite another member's support.
- Preserved residue ≠ current residue.
- Multiple REOPEN triggers ≠ one self-selecting REOPEN scope.
- Dependency-licensed broad REOPEN ≠ auditably recorded broad REOPEN.

## Recommended successor

`FSP-SRF-WARRANT-CROSSING-2.1 — Adversarial Hardening Patch, Standing Multiplicity, Provenance Commitments, Delegated Coalition Recomposition, Residue Freshness, and REOPEN Trigger Arbitration`

This should patch the canonical reducer only after reviewing whether the hardened stress semantics are philosophically acceptable, especially the meaning of standing conflict and residue freshness.
