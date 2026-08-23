import { ActorState, Domain } from './types';

export const INITIAL_FROZEN_TEMPLATE: Omit<ActorState, 'actor_id' | 'lineage_id' | 'birth_seed'> = {
  generation: 0,
  developmental_stage: 'INITIAL',
  global_plasticity: 0.85,
  domain_plasticity: {
    TECHNICAL: 0.85,
    SOCIAL: 0.85,
    RISK: 0.85,
    GOVERNANCE: 0.85,
    UNKNOWN: 0.85,
  },
  metaplasticity_rate: 0.12,
  salience_weights: {
    TECHNICAL: 0.2,
    SOCIAL: 0.2,
    RISK: 0.2,
    GOVERNANCE: 0.2,
    UNKNOWN: 0.2,
  },
  priors: {
    'action.default': 'EXPLORE_BOUNDED',
    'risk.baseline': 'MODERATE_CAUTION',
    'evidence.requirement': 'BALANCED',
  },
  dispositions: [
    {
      domain: 'TECHNICAL',
      belief: 'SYSTEM_FOLLOWS_DETERMINISTIC_RULES',
      policy: 'TEST_PREDICTION_FIRST',
      confidence: 0.5,
      evidenceCount: 0,
      evidenceDemandThreshold: 0.5,
      lastUpdated: 0,
    },
    {
      domain: 'SOCIAL',
      belief: 'PEER_TESTIMONY_IS_INFORMATIVE_NOT_ABSOLUTE',
      policy: 'CROSS_EXAMINE_PEER_CLAIMS',
      confidence: 0.5,
      evidenceCount: 0,
      evidenceDemandThreshold: 0.5,
      lastUpdated: 0,
    },
    {
      domain: 'RISK',
      belief: 'UNKNOWN_ENVIRONMENTS_REQUIRE_AUDIT',
      policy: 'BOUND_STEP_SIZE',
      confidence: 0.5,
      evidenceCount: 0,
      evidenceDemandThreshold: 0.5,
      lastUpdated: 0,
    },
  ],
  confidence_calibration_error: 0.0,
  evidence_demand_threshold: 0.5,
  contradiction_sensitivity: 0.5,
  risk_tolerance_proxy: 0.5,
  novelty_sensitivity: 0.7,
  memories: [],
  active_workspace: [],
  rejected_candidates_audit: [],
  consolidated_schemas: [],
  pruned_records: [],
  self_model: [],
  experience_ledger: [],
  alerts: [],
  contradictions_count: 0,
  provenance_log: [],
};

/**
 * Creates an exact newborn actor starting from the canonical frozen baseline.
 * Guarantees structural and numeric equivalence across all newborns created with the same seed.
 */
export function createNewbornActor(
  actorId: string,
  lineageId: string = 'GENESIS_LINEAGE_0',
  birthSeed: number = 42
): ActorState {
  // Deep clone frozen template
  const cloned = JSON.parse(JSON.stringify(INITIAL_FROZEN_TEMPLATE));

  const newborn: ActorState = {
    ...cloned,
    actor_id: actorId,
    lineage_id: lineageId,
    birth_seed: birthSeed,
    provenance_log: [`BIRTH[actor=${actorId}, lineage=${lineageId}, seed=${birthSeed}, ts=${Date.now()}]`],
  };

  return newborn;
}

/**
 * Validates whether two newborn states are structurally and numerically byte-equivalent
 * except for their IDs.
 */
export function assertNewbornsEquivalent(a: ActorState, b: ActorState): boolean {
  const normA = { ...a, actor_id: '__ID__', lineage_id: '__LINEAGE__', provenance_log: [] };
  const normB = { ...b, actor_id: '__ID__', lineage_id: '__LINEAGE__', provenance_log: [] };
  return JSON.stringify(normA) === JSON.stringify(normB);
}
