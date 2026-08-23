import { ActorState, TeacherTask, TransferComparisonResult } from './types';
import { generateCurriculum } from './curriculum';
import { updateActorWorkspace, deliberateAction } from './workspace';
import { RawSignal } from './salience';

/**
 * Runs a common unseen transfer test across multiple actors to measure behavioral divergence.
 */
export function runTransferEvaluation(
  actors: ActorState[],
  taskCount: number = 3
): TransferComparisonResult[] {
  const transferTasks = generateCurriculum('TRANSFER', taskCount, 999);
  const results: TransferComparisonResult[] = [];

  for (const task of transferTasks) {
    const actorResponses = actors.map((actor) => {
      // Setup workspace signals for the task
      const signals: RawSignal[] = task.contextSignals.map((sig, idx) => ({
        id: `TRANSFER_SIG_${task.id}_${idx}`,
        source: task.id,
        domain: task.domain,
        content: sig,
        urgency: 0.5,
        noveltyEstimate: 0.8,
      }));

      updateActorWorkspace(actor, signals, 7);

      const deliberation = deliberateAction(
        actor,
        task.options.map((o) => ({
          action: o.action,
          expectedOutcome: o.expectedOutcome,
          riskLevel: o.riskLevel,
        })),
        task.domain
      );

      const chosen = deliberation.action;
      const success = chosen === task.knownGroundTruth;

      return {
        actor_id: actor.actor_id,
        chosenAction: chosen,
        evidenceDemanded: parseFloat(actor.evidence_demand_threshold.toFixed(3)),
        confidence: deliberation.confidence,
        predictedOutcome: deliberation.expectedOutcome,
        success,
        retrievedMemoriesCount: deliberation.supportingMemories.length,
        activeDispositions: actor.dispositions.map((d) => `${d.domain}:${d.policy}`),
        plasticityAtTest: actor.domain_plasticity[task.domain] ?? actor.global_plasticity,
      };
    });

    // Compute divergence: measure how different the chosen actions and evidence demands are
    const uniqueActions = new Set(actorResponses.map((r) => r.chosenAction)).size;
    const divergenceScore = parseFloat((uniqueActions / Math.max(1, actors.length)).toFixed(3));

    results.push({
      taskId: task.id,
      taskDescription: task.description,
      actors: actorResponses,
      divergenceScore,
    });
  }

  return results;
}
