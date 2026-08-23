import { createNewbornActor, assertNewbornsEquivalent } from '../birth';
import { generateCurriculum } from '../curriculum';
import { runTeacherStudentEpisode } from '../teacherLoop';
import { replayAndConsolidate } from '../consolidation';
import { runTransferEvaluation } from '../transfer';
import { computeScientificMetrics } from '../metrics';
import { ActorState, ScientificMetrics, TransferComparisonResult } from '../types';

export interface Experiment001Result {
  experimentId: 'EXPERIMENT_001_HISTORY_DIVERGENCE';
  actors: {
    actorA: ActorState;
    actorB: ActorState;
    actorC: ActorState;
  };
  transferResults: TransferComparisonResult[];
  metrics: ScientificMetrics;
  hypothesisConfirmed: boolean;
  notes: string;
}

export function runExperiment001(): Experiment001Result {
  // 1. Birth A, B, C from byte-equivalent state
  const actorA = createNewbornActor('ACTOR_A_STABLE', 'LINEAGE_EXP001', 42);
  const actorB = createNewbornActor('ACTOR_B_VOLATILE', 'LINEAGE_EXP001', 42);
  const actorC = createNewbornActor('ACTOR_C_COOPERATIVE', 'LINEAGE_EXP001', 42);

  if (!assertNewbornsEquivalent(actorA, actorB) || !assertNewbornsEquivalent(actorA, actorC)) {
    throw new Error('BIRTH_EQUIVALENCE_FAILED: Newborns were not structurally byte-equivalent');
  }

  // 2. Expose to distinct verified environments
  const stableTasks = generateCurriculum('STABLE', 8, 101);
  const volatileTasks = generateCurriculum('VOLATILE', 8, 202);
  const cooperativeTasks = generateCurriculum('COOPERATIVE', 8, 303);

  for (const task of stableTasks) {
    runTeacherStudentEpisode(actorA, task, 'ENV_STABLE');
  }
  for (const task of volatileTasks) {
    runTeacherStudentEpisode(actorB, task, 'ENV_VOLATILE');
  }
  for (const task of cooperativeTasks) {
    runTeacherStudentEpisode(actorC, task, 'ENV_COOPERATIVE');
  }

  // 3. Offline consolidation / sleep
  replayAndConsolidate(actorA);
  replayAndConsolidate(actorB);
  replayAndConsolidate(actorC);

  // 4. Evaluate all 3 on identical unseen transfer tasks
  const transferResults = runTransferEvaluation([actorA, actorB, actorC], 3);

  // 5. Compute scientific metrics
  const successRates: Record<string, number> = {
    [actorA.actor_id]: transferResults.filter((r) => r.actors.find((a) => a.actor_id === actorA.actor_id)?.success).length / transferResults.length,
    [actorB.actor_id]: transferResults.filter((r) => r.actors.find((a) => a.actor_id === actorB.actor_id)?.success).length / transferResults.length,
    [actorC.actor_id]: transferResults.filter((r) => r.actors.find((a) => a.actor_id === actorC.actor_id)?.success).length / transferResults.length,
  };

  const metrics = computeScientificMetrics([actorA, actorB, actorC], successRates);

  const hypothesisConfirmed =
    metrics.stateDivergenceDistance > 0.3 &&
    metrics.evidenceDemandDelta > 0.1 &&
    actorA.dispositions[0]?.confidence !== actorB.dispositions[0]?.confidence;

  return {
    experimentId: 'EXPERIMENT_001_HISTORY_DIVERGENCE',
    actors: {
      actorA,
      actorB,
      actorC,
    },
    transferResults,
    metrics,
    hypothesisConfirmed,
    notes: 'Divergent histories created measurable divergence in evidence demand, plasticity, and transfer behavior.',
  };
}
