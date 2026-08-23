import { ActorState, SelfModelClaim } from './types';

/**
 * Updates the actor's observable self-model claims strictly backed by explicit evidence links.
 * Prohibits self-asserted or unsupported capability claims.
 */
export function updateSelfModelFromEvidence(actor: ActorState): SelfModelClaim[] {
  const claims: SelfModelClaim[] = [];
  const now = Date.now();

  // Technical Domain claim
  const technicalVerified = actor.experience_ledger.filter(
    (e) => e.domain === 'TECHNICAL' && e.evidenceStatus === 'VERIFIED'
  );
  if (technicalVerified.length > 0) {
    claims.push({
      aspect: 'TECHNICAL_TASK_EXECUTION',
      observedCapacity: `Demonstrated ${technicalVerified.length} verified technical predictions`,
      evidenceIds: technicalVerified.map((e) => `EXP_SEQ_${e.sequence}`),
      confidence: Math.min(0.95, 0.4 + technicalVerified.length * 0.1),
      lastVerified: now,
    });
  }

  // Risk Calibration claim
  const riskDispositions = actor.dispositions.find((d) => d.domain === 'RISK');
  if (riskDispositions && riskDispositions.evidenceCount > 0) {
    claims.push({
      aspect: 'RISK_CALIBRATION',
      observedCapacity: `Maintains evidence demand threshold at ${riskDispositions.evidenceDemandThreshold.toFixed(2)}`,
      evidenceIds: [`DISP_RISK_EVID_${riskDispositions.evidenceCount}`],
      confidence: riskDispositions.confidence,
      lastVerified: now,
    });
  }

  // Contradiction Adaptation claim
  if (actor.contradictions_count > 0) {
    claims.push({
      aspect: 'CONTRADICTION_RESILIENCE',
      observedCapacity: `Reopened local plasticity across ${actor.contradictions_count} contradiction encounters`,
      evidenceIds: actor.experience_ledger
        .filter((e) => e.evidenceStatus === 'CONTRADICTED')
        .map((e) => `EXP_SEQ_${e.sequence}`),
      confidence: 0.8,
      lastVerified: now,
    });
  }

  actor.self_model = claims;
  return claims;
}
