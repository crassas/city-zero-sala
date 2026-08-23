import { ActorState, WorkspaceItem, RejectedWorkspaceCandidate, Domain } from './types';
import { RawSignal, selectWorkspaceItems } from './salience';
import { retrieveMemories } from './memory';

export interface ActionHypothesis {
  action: string;
  expectedOutcome: string;
  supportingMemories: string[];
  riskAssessment: number;
  confidence: number;
  rationale: string;
}

/**
 * Updates actor's observable workspace with incoming raw signals.
 */
export function updateActorWorkspace(
  actor: ActorState,
  signals: RawSignal[],
  k: number = 7
): { admitted: WorkspaceItem[]; rejected: RejectedWorkspaceCandidate[] } {
  const { admitted, rejected } = selectWorkspaceItems(actor, signals, k);
  actor.active_workspace = admitted;
  actor.rejected_candidates_audit = rejected;
  return { admitted, rejected };
}

/**
 * Evaluates candidate actions within the bounded workspace and memory context.
 */
export function deliberateAction(
  actor: ActorState,
  candidateActions: { action: string; expectedOutcome: string; riskLevel: number }[],
  domain: Domain
): ActionHypothesis {
  // Retrieve relevant memories
  const relevantMemories = retrieveMemories(actor, {
    queryDomain: domain,
    limit: 5,
  });

  // Calculate memory-guided scores for each action
  const scoredActions = candidateActions.map((cand) => {
    let support = 0.5;
    const memoryKeys: string[] = [];

    for (const mem of relevantMemories) {
      if (mem.value.includes(cand.action) || mem.key.includes(cand.action)) {
        memoryKeys.push(mem.id);
        if (mem.evidenceStatus === 'VERIFIED') {
          support += 0.25 * mem.confidence;
        } else if (mem.evidenceStatus === 'CONTRADICTED') {
          support -= 0.35;
        }
      }
    }

    // Account for actor's risk tolerance and evidence demand
    const isRisky = cand.riskLevel > actor.risk_tolerance_proxy;
    const meetsDemand = (support >= actor.evidence_demand_threshold);

    let finalScore = support;
    if (isRisky && !meetsDemand) {
      finalScore -= 0.3; // Penalty for insufficiently corroborated risky action
    }

    return {
      cand,
      support: Math.max(0.05, Math.min(0.95, finalScore)),
      supportingMemories: memoryKeys,
    };
  });

  // Pick highest scoring candidate
  scoredActions.sort((a, b) => b.support - a.support);
  const best = scoredActions[0] || {
    cand: candidateActions[0],
    support: 0.5,
    supportingMemories: [],
  };

  return {
    action: best.cand.action,
    expectedOutcome: best.cand.expectedOutcome,
    supportingMemories: best.supportingMemories,
    riskAssessment: best.cand.riskLevel,
    confidence: parseFloat(best.support.toFixed(3)),
    rationale: `WORKSPACE_DELIBERATION: score=${best.support.toFixed(3)}, memories=${best.supportingMemories.length}`,
  };
}
