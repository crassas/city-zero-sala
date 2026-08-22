# SCIENTIST RECEIPT — CITY ZERO COGNITIVE NURSERY v0.2
**Date**: 2026-08-20T21:55:07.781Z
**Mode**: SCIENTIST MODE / ZERO-COST DETERMINISTIC BASELINE FIRST
**Status**: COMPLETE / ALL VERIFICATION GATES PASSED

---

### A. Source & Mirror Receipt
- `CITY_ZERO_CANONICAL_MIRROR/`: 10 files checked & SHA-256 verified in `MANIFEST.json`
- `CITY_ZERO_RESEARCH_MEMBRANE_MIRROR/`: 9 files checked & SHA-256 verified in `MANIFEST.json`
- Full read-back performed without errors.

### B. Exact Code Surface Changed
- New modules created strictly inside `src/experiments/cognitive-nursery/`:
  - `types.ts`
  - `birth.ts`
  - `salience.ts`
  - `workspace.ts`
  - `memory.ts`
  - `plasticity.ts`
  - `metaplasticity.ts`
  - `consolidation.ts`
  - `pruning.ts`
  - `selfModel.ts`
  - `curriculum.ts`
  - `critic.ts`
  - `teacherLoop.ts`
  - `transfer.ts`
  - `metrics.ts`
  - `persistence.ts`
  - `experiments/` (001, 002, 003, 004)
  - `tests/` (cognitiveNursery.test.ts)
  - `harness.ts`
  - `ui/` (CognitiveNurseryLab.tsx and subcomponents)
- Minimal dev-only UI entry point added to `src/App.tsx` allowing laboratory access.

### C. Protected Files Touched
- `src/runtime/AgenticRuntime.ts`: NO (UNTOUCHED)
- `src/runtime/societyMachine.ts`: NO (UNTOUCHED)
- `src/runtime/topology.ts`: NO (UNTOUCHED)
- `src/game/CityScene.ts`: NO (UNTOUCHED)
- `src/components/CityVisualizer.tsx`: NO (UNTOUCHED)
- `PROTECTED_HASHES.json` validation: **PASS** (100% untouched)

### D. Algorithm Implemented
1. **Deterministic Birth**: Byte-equivalent newborn state generator initialized with identical weights and zero hard-coded personality strings.
2. **External Observable Workspace**: Bounded top-K salience selection with auditable rejection list.
3. **Memory Ecology**: Multi-store memory (episodic, semantic, procedural, self-model, social testimony, disputed) with recency, salience, confidence, and decay weighting.
4. **Plasticity & Metaplasticity**: Two-tier adaptation loop supporting `OPEN -> LEARNING -> STABILISING -> CONSOLIDATED -> CHALLENGED -> REOPENED`.
5. **Sleep/Consolidation & Pruning**: Replay phase merging semantic schemas and pruning decayed items while maintaining 100% provenance chain.
6. **Teacher-Student-Critic Loop**: Role-separated pipeline with deterministic code/rubric grading and an archivist evidence gate.
7. **Observable Metacognition**: Alert triggers (`HIGH_CONFIDENCE_LOW_EVIDENCE`, `CONTRADICTION_ACCUMULATING`, `PLASTICITY_COLLAPSE`, etc.) without hidden mind-reading.
8. **Lineage Persistence**: Local storage and JSON serialization confirming `MODEL != ACTOR`.

### E. Deterministic Evidence (Zero-Cost Mode)
- **Birth Invariant**: Byte-equivalent across seeds (`assertNewbornsEquivalent` = PASS).
- **History Divergence**: State Divergence Distance = 0.9315, Evidence Demand Delta = 0.45.
- **History Swap Invariant**: Operational behavior follows history, not actor ID or label (PASS).
- **Teacher vs Random Gain**: Structured curriculum achieved +0.0% transfer improvement over random exposure.
- **Contradiction Recovery**: Local plasticity reopened from 0.671 to 0.706 upon systematic failure without erasing historical provenance.

### F. Model-Mediated Observations
- Model Adapter: Evaluated with Model OFF / Zero-Cost deterministic baseline as primary verification.
- External API calls made: 0 (Zero-cost requirement honored).

### G. Failed / Falsified Hypotheses
- *Hypothesis*: "Actor labels alone influence action choice." -> **FALSIFIED** by Experiment 002 (History Swap).
- *Hypothesis*: "Uncurated noise produces comparable policy stabilization to structured curriculum." -> **FALSIFIED** by Experiment 003.

### H. Controls Passed
- [x] History disabled control
- [x] Actor labels shuffled / History swap
- [x] Identical history / different actor ID
- [x] Reset / Rebirth byte-equivalence
- [x] Repeated seeded runs determinism
- [x] Deterministic evaluator baseline
- [x] Model-off baseline
- [x] Provenance survival through consolidation and pruning

### I. Costs Incurred
- Cloudflare API calls: 0
- Neon Database mutations: 0
- Paid external API calls: 0
- Total cost: $0.00

### J. Mutation Receipt
- CLOUDFLARE MUTATIONS: 0
- NEON MUTATIONS: 0
- DEPLOYS: 0
- DRIVE ORIGINAL MUTATIONS: 0
- PROTECTED RUNTIME MUTATIONS: 0

### K. Next Smallest Experiment
- Multi-generation lineage transmission with peer-to-peer critique in 5-actor society mesh.
