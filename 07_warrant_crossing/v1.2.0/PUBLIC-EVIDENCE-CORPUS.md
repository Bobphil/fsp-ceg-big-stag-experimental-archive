# FSP-SRF Warrant-Crossing Public Evidence Corpus — v1.2.0

Status: **PUBLIC EXECUTABLE EVIDENCE CORPUS / COMMIT-BOUND CANDIDATE**

Date: 2026-11-24

## Purpose

This branch publishes the executable evidence supporting the warrant-crossing discussion in *Living Among Partial Worlds*.

It contains:

- a runnable `FSP-SRF-WARRANT-CROSSING-2.1` package with reducer, invariants, fixtures, acceptance tests, regression tests, and adversarial hardening tests;
- the pre-patch baseline reducer and adversarial stress harness from `FSP-SRF-WARRANT-CROSSING-STRESS-1`;
- stress findings and build reports documenting the conceptual repairs promoted into 2.1.

## Reproduction

### Hardened 2.1

```bash
cd 07_warrant_crossing/v1.2.0/FSP-SRF-WARRANT-CROSSING-2.1
npm test
```

Expected: **40/40 PASS**.

### Adversarial stress cases

```bash
cd 07_warrant_crossing/v1.2.0/FSP-SRF-WARRANT-CROSSING-STRESS-1
npm run test:adversarial
```

The adversarial suite is designed to expose baseline weaknesses and verify corresponding hardened controls. A PASS therefore includes reproducible exposure of vulnerabilities; it does not mean the baseline was already robust.

## Fresh local verification before public binding

- Warrant Crossing 2 baseline: **25/25 PASS**
- Stress build combined suite: **40/40 PASS**
- Warrant Crossing 2.1: **40/40 PASS**
- Node.js: **v22.16.0**
- npm: **10.9.2**

## Packaging checksums

The locally frozen packages used to construct this public corpus were:

- `FSP-SRF-WARRANT-CROSSING-PUBLIC-CORPUS-1.2.zip`
  - SHA-256: `8c9308542f59d7529146d1ac462472f95811754f358f3520ab2093b2f424c133`
- `FSP-CEG-BIG-STAG-EXPERIMENTAL-ARCHIVE-1.2.zip`
  - SHA-256: `1e0c45dc6bf6d3ffa4648d2aae4ad90a1444e5ea5b894c2c113295739b770bee`

The ZIP checksums identify the packaging objects. The immutable Git commit that contains this unpacked corpus is the preferred public evidence binding.

## Relation to Zenodo v1.1.0

Zenodo version DOI `10.5281/zenodo.24467051` identifies the earlier v1.1.0 archive and **does not contain this warrant-crossing corpus**.

Do not cite v1.1.0 as though it supports the new warrant-crossing experiments.

A later Zenodo version may archive this corpus and receive its own version DOI. Until then, cite the immutable GitHub commit recorded in the main-branch public binding record.

## Claim ceiling

**Public rerunnability ≠ empirical effectiveness ≠ moral legitimacy ≠ institutional adequacy.**

**Commit binding establishes source continuity; it does not establish the truth of the philosophical claims encoded by the source.**
