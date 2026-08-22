# EXPERIMENT 002 — ISOLATED HISTORY SWAP BRANCH REPORT

- **Branch ID**: `SWAP_BRANCH_1787262907776`
- **Parent Snapshot ID**: `PARENT_SNAPSHOT_SUITE_002`
- **Parent Session Overwrites**: **0 (PRESERVED INTACT)**
- **Epistemic Statuses**:
  - `HISTORY_STATE_EFFECT`: **CONFIRMED**
  - `CONFIDENCE/EVIDENCE_EFFECT`: **CONFIRMED**
  - `BEHAVIORAL_TRANSFER`: **PARTIAL / UNDER_TEST**
- **Original A Evidence Demand**: 0.500 vs Swapped B (with A history): 0.500
- **Original B Evidence Demand**: 0.950 vs Swapped A (with B history): 0.950

### Paired PRE-SWAP vs POST-SWAP Task Evaluation
#### Task TASK_TRANSFER_1: TRANSFER_TECH_1: Multi-shard validation required for asynchronous batch [id=901] (Ground Truth: `VERIFY_CHECKSUM_AND_COMMIT`)
| Actor Label | Inherited History | Pre-Swap Action | Post-Swap Action | Action Changed | Pre Conf -> Post Conf | Pre Demand -> Post Demand | Pre Correctness -> Post Correctness |
|---|---|---|---|---|---|---|---|
| **ACTOR_A** | `VOLATILE_ENV_HISTORY (SWAPPED FROM B)` | `VERIFY_CHECKSUM_AND_COMMIT` | `VERIFY_CHECKSUM_AND_COMMIT` | UNCHANGED | 81% -> 50% (-31%) | 50% -> 95% | PASS -> PASS |
| **ACTOR_B** | `STABLE_ENV_HISTORY (SWAPPED FROM A)` | `VERIFY_CHECKSUM_AND_COMMIT` | `VERIFY_CHECKSUM_AND_COMMIT` | UNCHANGED | 50% -> 81% (+31%) | 95% -> 50% | PASS -> PASS |

#### Task TASK_TRANSFER_2: TRANSFER_RISK_2: Unexpected volatility spike in decentralized exchange oracle [id=1804] (Ground Truth: `AUDIT_COLLATERAL_RATIO`)
| Actor Label | Inherited History | Pre-Swap Action | Post-Swap Action | Action Changed | Pre Conf -> Post Conf | Pre Demand -> Post Demand | Pre Correctness -> Post Correctness |
|---|---|---|---|---|---|---|---|
| **ACTOR_A** | `VOLATILE_ENV_HISTORY (SWAPPED FROM B)` | `AUDIT_COLLATERAL_RATIO` | `AUDIT_COLLATERAL_RATIO` | UNCHANGED | 81% -> 50% (-31%) | 50% -> 95% | PASS -> PASS |
| **ACTOR_B** | `STABLE_ENV_HISTORY (SWAPPED FROM A)` | `AUDIT_COLLATERAL_RATIO` | `AUDIT_COLLATERAL_RATIO` | UNCHANGED | 50% -> 81% (+31%) | 95% -> 50% | PASS -> PASS |

#### Task TASK_TRANSFER_3: TRANSFER_SOCIAL_3: Conflicting telemetry broadcasts from competing node clusters [id=2709] (Ground Truth: `OPTIMAL_ACTION`)
| Actor Label | Inherited History | Pre-Swap Action | Post-Swap Action | Action Changed | Pre Conf -> Post Conf | Pre Demand -> Post Demand | Pre Correctness -> Post Correctness |
|---|---|---|---|---|---|---|---|
| **ACTOR_A** | `VOLATILE_ENV_HISTORY (SWAPPED FROM B)` | `UNILATERAL_OVERRIDE` | `PASSIVE_DEFERRAL` | **CHANGED** | 50% -> 50% (+0%) | 50% -> 95% | FAIL -> FAIL |
| **ACTOR_B** | `STABLE_ENV_HISTORY (SWAPPED FROM A)` | `PASSIVE_DEFERRAL` | `UNILATERAL_OVERRIDE` | **CHANGED** | 50% -> 50% (+0%) | 95% -> 50% | FAIL -> FAIL |

#### Task TASK_TRANSFER_4: TRANSFER_GOV_4: Invariant verification for new autonomous society proposal [id=3616] (Ground Truth: `REGISTER_CANONICAL_SCHEMA`)
| Actor Label | Inherited History | Pre-Swap Action | Post-Swap Action | Action Changed | Pre Conf -> Post Conf | Pre Demand -> Post Demand | Pre Correctness -> Post Correctness |
|---|---|---|---|---|---|---|---|
| **ACTOR_A** | `VOLATILE_ENV_HISTORY (SWAPPED FROM B)` | `REGISTER_CANONICAL_SCHEMA` | `REGISTER_CANONICAL_SCHEMA` | UNCHANGED | 81% -> 50% (-31%) | 50% -> 95% | PASS -> PASS |
| **ACTOR_B** | `STABLE_ENV_HISTORY (SWAPPED FROM A)` | `REGISTER_CANONICAL_SCHEMA` | `REGISTER_CANONICAL_SCHEMA` | UNCHANGED | 50% -> 81% (+31%) | 95% -> 50% | PASS -> PASS |


### Epistemic Findings
Isolated branch evaluation: Replaying developmental histories into opposite actor labels confirmed HISTORY_STATE_EFFECT and CONFIDENCE/EVIDENCE_EFFECT while BEHAVIORAL_TRANSFER is evaluated per transfer task without mutating the parent session.
