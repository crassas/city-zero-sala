import { ActorState, MetacognitiveAlert } from './types';

/**
 * Computes explicit observable metacognitive alerts based purely on verifiable evidence metrics,
 * without asserting internal hidden states.
 */
export function evaluateMetacognitiveAlerts(actor: ActorState): MetacognitiveAlert[] {
  const alerts: MetacognitiveAlert[] = [];
  const now = Date.now();

  // 1. HIGH_CONFIDENCE_LOW_EVIDENCE
  for (const disp of actor.dispositions) {
    if (disp.confidence > 0.8 && disp.evidenceCount < 3) {
      alerts.push({
        type: 'HIGH_CONFIDENCE_LOW_EVIDENCE',
        severity: 'HIGH',
        domain: disp.domain,
        detail: `Domain ${disp.domain} has high confidence (${disp.confidence.toFixed(2)}) with only ${disp.evidenceCount} verified evidence items.`,
        timestamp: now,
      });
    }
  }

  // 2. CONTRADICTION_ACCUMULATING
  if (actor.contradictions_count >= 3) {
    alerts.push({
      type: 'CONTRADICTION_ACCUMULATING',
      severity: 'HIGH',
      detail: `Accumulated ${actor.contradictions_count} contradiction events; policy stability challenged.`,
      timestamp: now,
    });
  }

  // 3. PLASTICITY_COLLAPSE
  if (actor.global_plasticity < 0.1) {
    alerts.push({
      type: 'PLASTICITY_COLLAPSE',
      severity: 'MEDIUM',
      detail: `Global plasticity (${actor.global_plasticity.toFixed(3)}) is below 0.10, indicating potential rigidity.`,
      timestamp: now,
    });
  }

  // 4. EXCESSIVE_PLASTICITY
  if (actor.global_plasticity > 0.9 && actor.experience_ledger.length > 10) {
    alerts.push({
      type: 'EXCESSIVE_PLASTICITY',
      severity: 'LOW',
      detail: `Global plasticity remains high (${actor.global_plasticity.toFixed(3)}) despite ${actor.experience_ledger.length} experiences.`,
      timestamp: now,
    });
  }

  // 5. STALE_SCHEMA
  for (const schema of actor.consolidated_schemas) {
    const ageHours = (now - schema.lastValidated) / (1000 * 3600);
    if (ageHours > 24) {
      alerts.push({
        type: 'STALE_SCHEMA',
        severity: 'LOW',
        domain: schema.domain,
        detail: `Consolidated schema ${schema.id} has not been validated recently.`,
        timestamp: now,
      });
    }
  }

  // 6. OVERFIT_TO_RECENT_HISTORY
  const recentEvents = actor.experience_ledger.slice(-5);
  if (recentEvents.length === 5) {
    const allSameDomain = recentEvents.every((e) => e.domain === recentEvents[0].domain);
    if (allSameDomain && actor.global_plasticity < 0.4) {
      alerts.push({
        type: 'OVERFIT_TO_RECENT_HISTORY',
        severity: 'MEDIUM',
        domain: recentEvents[0].domain,
        detail: `Last 5 experiences are concentrated in ${recentEvents[0].domain}, potential narrow local optimum.`,
        timestamp: now,
      });
    }
  }

  actor.alerts = alerts;
  return alerts;
}
