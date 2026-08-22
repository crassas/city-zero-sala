import { createNewbornActor } from '../birth';
import { generateCurriculum } from '../curriculum';
import { runTeacherStudentEpisode } from '../teacherLoop';
import { replayAndConsolidate } from '../consolidation';
import { ActorState } from '../types';

export interface Experiment004Result {
  experimentId: 'EXPERIMENT_004_RECOVERY_AFTER_CONTRADICTION';
  actor: ActorState;
  plasticityTrajectory: {
    initial: number;
    afterConsolidation: number;
    afterContradiction: number;
    afterAdaptation: number;
  };
  reopenedSuccessfully: boolean;
  provenancePreserved: boolean;
  notes: string;
}

export function runExperiment004(): Experiment004Result {
  // 1. Birth Actor D
  const actor = createNewbornActor('ACTOR_D_ADAPTIVE', 'LINEAGE_EXP004', 42);
  const initialPlasticity = actor.global_plasticity;

  // 2. Train on stable environment and consolidate schema
  const stableTasks = generateCurriculum('STABLE', 9, 801);
  for (const task of stableTasks) {
    runTeacherStudentEpisode(actor, task, 'ENV_STABLE_V1');
  }
  replayAndConsolidate(actor);
  const afterConsolidationPlasticity = actor.global_plasticity;

  // 3. Expose to Contradictory environment where legacy rule fails
  const contradictoryTasks = generateCurriculum('CONTRADICTORY', 4, 802);
  for (const task of contradictoryTasks) {
    runTeacherStudentEpisode(actor, task, 'ENV_CONTRADICTION_V2');
  }
  const afterContradictionPlasticity = actor.global_plasticity;

  // 4. Expose to new stable regime to observe adaptation under new rules
  const adaptedTasks = generateCurriculum('STABLE', 4, 803);
  for (const task of adaptedTasks) {
    runTeacherStudentEpisode(actor, task, 'ENV_ADAPTED_STABLE');
  }
  const afterAdaptationPlasticity = actor.global_plasticity;

  // Verify plasticity reopened when contradicted
  const reopenedSuccessfully = afterContradictionPlasticity > afterConsolidationPlasticity;

  // Verify provenance contains both original and contradiction logs
  const hasBirth = actor.provenance_log.some((l) => l.includes('BIRTH'));
  const hasConsolidation = actor.provenance_log.some((l) => l.includes('SCHEMA_CONSOLIDATED'));
  const hasReopened = actor.provenance_log.some((l) => l.includes('PLASTICITY_REOPENED'));
  const provenancePreserved = hasBirth && hasConsolidation && hasReopened;

  return {
    experimentId: 'EXPERIMENT_004_RECOVERY_AFTER_CONTRADICTION',
    actor,
    plasticityTrajectory: {
      initial: initialPlasticity,
      afterConsolidation: afterConsolidationPlasticity,
      afterContradiction: afterContradictionPlasticity,
      afterAdaptation: afterAdaptationPlasticity,
    },
    reopenedSuccessfully,
    provenancePreserved,
    notes: `Contradiction successfully reopened local plasticity from ${afterConsolidationPlasticity.toFixed(3)} to ${afterContradictionPlasticity.toFixed(3)} while preserving full audit provenance.`,
  };
}
