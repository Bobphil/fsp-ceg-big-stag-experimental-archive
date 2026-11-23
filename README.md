# FSP-CEG-BIG-STAG Experimental Archive

**Release target:** v1.1.0  
**Status:** executable reproducibility archive; public-release staging repository

This repository is the publication home for the Full-Stack Philosophy (FSP), Corrigible Ethical Governance (CEG), BIG STAG, recursive-inquiry, and organizational/emergence synthetic experimental lineage.

Fresh local archive verification reproduced:

- **BIG STAG / UCP-XR Experiment 2F:** 269/269 PASS
- **FSP-EMERGENT-LEVELS-1:** 300/300 PASS
- Node.js **v22.16.0**
- npm **10.9.2**

## Claim ceiling

This archive establishes computational rerunnability of the included deterministic synthetic architectures. It does **not** establish empirical validity, real-world effectiveness, real-world prevalence, or normative superiority.

**Architectural coherence ≠ demonstrated effectiveness.**

**Execution inside a model ≠ causal validity in the world.**

## Frozen payload

The complete checksum-frozen publication build is distributed as:

`FSP-CEG-BIG-STAG-GITHUB-ZENODO-PUBLICATION-1.1.zip`

The payload contains the exact recovered historical ZIP packages, runnable snapshots, audits, acceptance records, fresh rerun receipts, provenance maps, claim ceilings, and SHA-256 manifests.

Until that payload has been uploaded to this repository, the GitHub Actions reproducibility workflow will report the payload as pending rather than falsely claiming a repository-level rerun.

## Reproduction

After the frozen payload is present, the workflow reconstructs the publication tree and runs:

- `npm run test:all` in the BIG STAG 2F runnable snapshot
- `npm run test:all:emergent-levels` in the FSP Emergent Levels runnable snapshot

Expected results are 269/269 PASS and 300/300 PASS respectively.

## DOI publication

This repository includes `.zenodo.json` as the authoritative Zenodo GitHub-release metadata and `CITATION.cff` for GitHub citation display.

The intended release tag is **v1.1.0**. The Zenodo **version DOI** minted for that immutable release should be cited by the accompanying essay and future scholarly references.

## Licensing

No license has been silently assigned. The recommended publication choice is:

- executable code: **MIT**
- prose, audits, explanatory documentation, and original non-code material: **CC BY 4.0**

The author should explicitly adopt or modify that recommendation before the Zenodo release is published.
