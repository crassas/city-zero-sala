import { ActorState, Domain, WorkspaceItem, RejectedWorkspaceCandidate } from './types';

export interface RawSignal {
  id: string;
  source: string;
  domain: Domain;
  content: string;
  urgency: number; // 0 to 1
  noveltyEstimate: number; // 0 to 1
}

/**
 * Computes a deterministic salience score for a signal based on actor's salience weights,
 * novelty sensitivity, and signal urgency.
 */
export function computeSalience(actor: ActorState, signal: RawSignal): number {
  const domainWeight = actor.salience_weights[signal.domain] ?? 0.2;
  const noveltyFactor = signal.noveltyEstimate * actor.novelty_sensitivity;
  const urgencyFactor = signal.urgency;

  const score = domainWeight * 0.4 + noveltyFactor * 0.35 + urgencyFactor * 0.25;
  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Filter signals into top-K bounded workspace and auditable rejected candidates.
 */
export function selectWorkspaceItems(
  actor: ActorState,
  signals: RawSignal[],
  k: number = 7
): { admitted: WorkspaceItem[]; rejected: RejectedWorkspaceCandidate[] } {
  const scored = signals.map((sig) => ({
    signal: sig,
    score: computeSalience(actor, sig),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const admitted: WorkspaceItem[] = [];
  const rejected: RejectedWorkspaceCandidate[] = [];

  for (let i = 0; i < scored.length; i++) {
    const item = scored[i];
    if (i < k) {
      admitted.push({
        id: item.signal.id,
        source: item.signal.source,
        domain: item.signal.domain,
        content: item.signal.content,
        salienceScore: parseFloat(item.score.toFixed(4)),
        entryReason: `SALIENCE_TOP_K_RANK_${i + 1}_SCORE_${item.score.toFixed(3)}`,
        admittedAt: Date.now(),
      });
    } else {
      rejected.push({
        id: item.signal.id,
        source: item.signal.source,
        domain: item.signal.domain,
        content: item.signal.content,
        salienceScore: parseFloat(item.score.toFixed(4)),
        rejectionReason: `CAPACITY_EXCEEDED_K_${k}_RANK_${i + 1}`,
      });
    }
  }

  return { admitted, rejected };
}
