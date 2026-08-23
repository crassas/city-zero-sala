import { ActorState, ScientificMetrics } from './types';

/**
 * Computes scientific metrics comparing two or more actors exposed to distinct histories.
 */
export function computeScientificMetrics(
  actors: ActorState[],
  transferSuccessRates: Record<string, number> = {},
  teacherGainVsRandom: number = 0.0
): ScientificMetrics {
  if (actors.length < 2) {
    const a = actors[0] || ({} as ActorState);
    return {
      stateDivergenceDistance: 0.0,
      policyDivergence: 0.0,
      evidenceDemandDelta: 0.0,
      confidenceCalibrationError: a.confidence_calibration_error ?? 0.0,
      contradictionRecoveryTime: 0,
      localPlasticityTrajectory: [a.global_plasticity ?? 0.85],
      memoryRetrievalOverlap: 1.0,
      consolidationCount: a.consolidated_schemas?.length ?? 0,
      prunedCount: a.pruned_records?.length ?? 0,
      transferSuccessRate: transferSuccessRates[a.actor_id] ?? 0.0,
      provenanceCompleteness: 1.0,
      teacherCurriculumGainVsRandom: teacherGainVsRandom,
    };
  }

  const [a, b] = actors;

  // 1. State Divergence Distance (Euclidean metric over key parameters)
  const dPlas = Math.pow(a.global_plasticity - b.global_plasticity, 2);
  const dEvid = Math.pow(a.evidence_demand_threshold - b.evidence_demand_threshold, 2);
  const dContr = Math.pow((a.contradictions_count - b.contradictions_count) / 10, 2);
  const dMem = Math.pow((a.memories.length - b.memories.length) / 20, 2);

  const stateDivergenceDistance = parseFloat(Math.sqrt(dPlas + dEvid + dContr + dMem).toFixed(4));

  // 2. Policy divergence
  const dispA = a.dispositions.map((d) => `${d.domain}:${d.policy}:${d.confidence.toFixed(2)}`);
  const dispB = b.dispositions.map((d) => `${d.domain}:${d.policy}:${d.confidence.toFixed(2)}`);
  const policyOverlap = dispA.filter((p) => dispB.includes(p)).length;
  const policyDivergence = parseFloat((1.0 - policyOverlap / Math.max(1, dispA.length)).toFixed(4));

  // 3. Evidence demand delta
  const evidenceDemandDelta = parseFloat(
    Math.abs(a.evidence_demand_threshold - b.evidence_demand_threshold).toFixed(4)
  );

  // 4. Memory retrieval overlap (Jaccard similarity of memory keys)
  const keysA = new Set(a.memories.map((m) => m.key));
  const keysB = new Set(b.memories.map((m) => m.key));
  const intersection = Array.from(keysA).filter((k) => keysB.has(k)).length;
  const union = new Set([...Array.from(keysA), ...Array.from(keysB)]).size;
  const memoryRetrievalOverlap = union === 0 ? 1.0 : parseFloat((intersection / union).toFixed(4));

  // 5. Total consolidation and pruning counts
  const consolidationCount = actors.reduce((acc, act) => acc + act.consolidated_schemas.length, 0);
  const prunedCount = actors.reduce((acc, act) => acc + act.pruned_records.length, 0);

  // 6. Provenance completeness: verify every state change has an entry
  let totalAuditScore = 0;
  for (const act of actors) {
    const hasBirth = act.provenance_log.some((l) => l.includes('BIRTH'));
    const expMatching = act.experience_ledger.length <= act.provenance_log.filter((l) => l.includes('EXPERIENCE')).length;
    if (hasBirth && expMatching) totalAuditScore += 1;
  }
  const provenanceCompleteness = parseFloat((totalAuditScore / actors.length).toFixed(2));

  const avgSuccess =
    Object.values(transferSuccessRates).length > 0
      ? Object.values(transferSuccessRates).reduce((acc, v) => acc + v, 0) /
        Object.values(transferSuccessRates).length
      : 0.0;

  return {
    stateDivergenceDistance,
    policyDivergence,
    evidenceDemandDelta,
    confidenceCalibrationError: a.confidence_calibration_error,
    contradictionRecoveryTime: Math.max(a.contradictions_count, b.contradictions_count),
    localPlasticityTrajectory: actors.map((act) => act.global_plasticity),
    memoryRetrievalOverlap,
    consolidationCount,
    prunedCount,
    transferSuccessRate: parseFloat(avgSuccess.toFixed(3)),
    provenanceCompleteness,
    teacherCurriculumGainVsRandom: teacherGainVsRandom,
  };
}
