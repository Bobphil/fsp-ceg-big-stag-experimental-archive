# FSP-SRF-WARRANT-CROSSING-2.1

## Adversarial Hardening Patch

This package promotes the protections demonstrated by `FSP-SRF-WARRANT-CROSSING-STRESS-1` into the canonical warrant-crossing reducer. It preserves the X0–X7 architecture while hardening five governance surfaces: standing multiplicity, provenance commitments, coalition recomposition authority, residue freshness, and competing REOPEN arbitration. It also closes the broad-REOPEN audit gap exposed by the stress build.

## Fresh verification
- Core / inherited-conformance suite: **25/25 PASS**
- Hardening suite: **15/15 PASS**
- Full suite: **40/40 PASS**
- Node.js: **v22.16.0**
- npm: **10.9.2**

Run:
```bash
npm test
```

## Canonical changes from 2.0
1. Standing is plural: claims are preserved; contradictory claims create `contested` standing until a governed `RESOLVE_STANDING` event.
2. Authorization requires verified provenance. Optional warrant attestation commits the nested Toulmin/provenance payload and blocks authorization after unauthorized mutation.
3. Coalition updates require actor identity; cross-member updates require active delegation for `action-support`.
4. Preserved residue must be current, versioned, and timestamped. Superseded/expired material remains in the registry but cannot satisfy current-residue requirements.
5. Competing REOPEN triggers are first-class records. Incompatible targets require `RESOLVE_REOPEN` before reopening.
6. Broad REOPEN is permitted only with dependency evidence and the `OP-REOPEN` audit record now preserves `broad`, dependency evidence, and arbitration metadata.
7. Alternative warrants must be bounded, claim-linked, qualified, and supported by typed receiver-side provenance before they can support X4.

## Firewalls hardened
- Prior standing pass ≠ current uncontested standing.
- Present provenance ≠ verified provenance.
- Coalition update ≠ authority to rewrite another member's support.
- Preserved residue ≠ current residue.
- Multiple REOPEN triggers ≠ one self-selecting REOPEN scope.
- Nonempty support ≠ adequately specified alternative warrant.

## Claim ceiling
Executable hardening demonstrates conformance of these governance rules inside deterministic fixtures. It does not establish empirical effectiveness, moral legitimacy, institutional adequacy, or completeness of the attack surface.
