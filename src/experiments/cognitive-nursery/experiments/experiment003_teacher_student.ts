import { createNewbornActor } from '../birth';
import { generateCurriculum } from '../curriculum';
import { runTeacherStudentEpisode } from '../teacherLoop';
import { replayAndConsolidate } from '../consolidation';
import { runTransferEvaluation } from '../transfer';
import { computeScientificMetrics } from '../metrics';
import { ActorState, ScientificMetrics, TransferComparisonResult } from '../types';

export interface Experiment003Result {
  experimentId: 'EXPERIMENT_003_TEACHER_STUDENT';
  studentCurated: ActorState;
  studentRandom: ActorState;
  studentNoHistory: ActorState;
  transferResults: TransferComparisonResult[];
  metrics: ScientificMetrics;
  teacherGainVsRandom: number;
  hypothesisConfirmed: boolean;
  notes: string;
}

export function runExperiment003(): Experiment003Result {
  // 1. Birth 3 identical newborns
  const studentCurated = createNewbornActor('STUDENT_CURATED', 'LINEAGE_TEACHER', 42);
  const studentRandom = createNewbornActor('STUDENT_RANDOM', 'LINEAGE_TEACHER', 42);
  const studentNoHistory = createNewbornActor('STUDENT_UNTRAINED_BASELINE', 'LINEAGE_TEACHER', 42);

  // 2. Curated structured teacher curriculum
  const structuredTasks = generateCurriculum('STABLE', 9, 501);
  for (const task of structuredTasks) {
    runTeacherStudentEpisode(studentCurated, task, 'ENV_TEACHER_STRUCTURED');
  }
  replayAndConsolidate(studentCurated);

  // 3. Random uncurated experiences
  const randomTasks = [
    ...generateCurriculum('VOLATILE', 4, 701),
    ...generateCurriculum('CONTRADICTORY', 4, 702),
  ];
  for (const task of randomTasks) {
    runTeacherStudentEpisode(studentRandom, task, 'ENV_RANDOM_NOISE');
  }

  // 4. studentNoHistory receives 0 developmental events

  // 5. Transfer evaluation
  const transferResults = runTransferEvaluation(
    [studentCurated, studentRandom, studentNoHistory],
    4
  );

  // Calculate success rates
  const successCurated =
    transferResults.filter((r) => r.actors.find((a) => a.actor_id === studentCurated.actor_id)?.success).length /
    transferResults.length;
  const successRandom =
    transferResults.filter((r) => r.actors.find((a) => a.actor_id === studentRandom.actor_id)?.success).length /
    transferResults.length;
  const successUntrained =
    transferResults.filter((r) => r.actors.find((a) => a.actor_id === studentNoHistory.actor_id)?.success).length /
    transferResults.length;

  const teacherGainVsRandom = parseFloat((successCurated - successRandom).toFixed(3));

  const metrics = computeScientificMetrics(
    [studentCurated, studentRandom],
    {
      [studentCurated.actor_id]: successCurated,
      [studentRandom.actor_id]: successRandom,
      [studentNoHistory.actor_id]: successUntrained,
    },
    teacherGainVsRandom
  );

  const hypothesisConfirmed = successCurated >= successRandom && successCurated > successUntrained;

  return {
    experimentId: 'EXPERIMENT_003_TEACHER_STUDENT',
    studentCurated,
    studentRandom,
    studentNoHistory,
    transferResults,
    metrics,
    teacherGainVsRandom,
    hypothesisConfirmed,
    notes: `Structured teacher curriculum produced a +${(teacherGainVsRandom * 100).toFixed(1)}% performance gain over uncurated random exposure.`,
  };
}
