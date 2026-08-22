import { ActorState, Domain, ExperienceEvent, Disposition } from './types';
import { storeOrReinforceMemory } from './memory';
import { evaluateMetacognitiveAlerts } from './metaplasticity';

/**
 * Core developmental update function. Applies an ExperienceEvent to the ActorState.
 * Every state transition MUST originate from an ExperienceEvent.
 */
export function applyExperience(actor: ActorState, event: ExperienceEvent): ActorState {
  const domain = event.domain;
  const initialLocalPlasticity = actor.domain_plasticity[domain] ?? actor.global_plasticity;
  event.plasticityBefore = initialLocalPlasticity;
  event.confidenceBefore = actor.dispositions.find((d) => d.domain === domain)?.confidence ?? 0.5;

  // 1. Record experience in append-only ledger
  actor.experience_ledger.push(event);
  actor.provenance_log.push(
    `EXPERIENCE[seq=${event.sequence}, domain=${domain}, status=${event.evidenceStatus}, surprise=${event.surprise.toFixed(2)}]`
  );

  // 2. Adjust local and global plasticity based on prediction outcome & surprise
  let deltaPlasticity = 0;
  if (event.evidenceStatus === 'CONTRADICTED' || event.surprise > 0.6) {
    // Contradiction / strong surprise reopens local and global plasticity
    deltaPlasticity = 0.15 * actor.metaplasticity_rate * (1 + event.contradictionLevel);
    actor.contradictions_count += 1;
    actor.developmental_stage = 'REOPENED';
    actor.provenance_log.push(`PLASTICITY_REOPENED[domain=${domain}, delta=+${deltaPlasticity.toFixed(3)}]`);
  } else if (event.evidenceStatus === 'VERIFIED') {
    // Verified success gradually stabilizes / lowers plasticity
    deltaPlasticity = -0.05 * (1 - initialLocalPlasticity * 0.5);
    if (initialLocalPlasticity < 0.3) {
      actor.developmental_stage = 'CONSOLIDATED';
    } else if (initialLocalPlasticity < 0.6) {
      actor.developmental_stage = 'STABILISING';
    } else {
      actor.developmental_stage = 'LEARNING';
    }
  }

  const updatedLocal = Math.min(0.95, Math.max(0.05, initialLocalPlasticity + deltaPlasticity));
  actor.domain_plasticity[domain] = parseFloat(updatedLocal.toFixed(4));

  // Update global plasticity as average of domain plasticities
  const domains: Domain[] = ['TECHNICAL', 'SOCIAL', 'RISK', 'GOVERNANCE', 'UNKNOWN'];
  const avg = domains.reduce((acc, d) => acc + (actor.domain_plasticity[d] ?? 0.5), 0) / domains.length;
  actor.global_plasticity = parseFloat(avg.toFixed(4));
  event.plasticityAfter = actor.domain_plasticity[domain];

  // 3. Update Domain Disposition
  let disp = actor.dispositions.find((d) => d.domain === domain);
  if (!disp) {
    disp = {
      domain,
      belief: `BELIEF_INITIAL_${domain}`,
      policy: `POLICY_DEFAULT_${domain}`,
      confidence: 0.5,
      evidenceCount: 0,
      evidenceDemandThreshold: 0.5,
      lastUpdated: Date.now(),
    };
    actor.dispositions.push(disp);
  }

  if (event.evidenceStatus === 'VERIFIED') {
    disp.confidence = Math.min(0.99, disp.confidence + 0.1 * updatedLocal);
    disp.evidenceCount += 1;
    // As confidence builds with verification, evidence demand adjusts
    disp.evidenceDemandThreshold = Math.max(0.2, disp.evidenceDemandThreshold - 0.02);
  } else if (event.evidenceStatus === 'CONTRADICTED') {
    disp.confidence = Math.max(0.1, disp.confidence - 0.25 * updatedLocal);
    // After contradiction, actor demands more evidence before taking actions
    disp.evidenceDemandThreshold = Math.min(0.95, disp.evidenceDemandThreshold + 0.15);
    actor.evidence_demand_threshold = Math.min(0.95, actor.evidence_demand_threshold + 0.08);
  }
  disp.lastUpdated = Date.now();
  event.confidenceAfter = disp.confidence;
  event.affectedDispositions = [disp.belief, disp.policy];

  // 4. Memory Integration
  storeOrReinforceMemory(actor, {
    type: event.socialCorroboration > 0.5 ? 'SOCIAL_TESTIMONY' : 'EPISODIC',
    domain,
    key: `OBS_${domain}_${event.sequence}`,
    value: `ACTION[${event.chosenAction}] -> OUTCOME[${event.actualOutcome}]`,
    source: event.environmentId,
    evidenceStatus: event.evidenceStatus,
    confidence: disp.confidence,
    salience: event.salience,
    provenance: `EXP_SEQ_${event.sequence}`,
  });

  // 5. Metacognitive alert evaluation
  evaluateMetacognitiveAlerts(actor);

  return actor;
}
