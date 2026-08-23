import { CriticScore, TeacherTask } from './types';

/**
 * Deterministic rubric-based Critic.
 * Grades student responses against explicit objective criteria, producing verified audit scores.
 */
export function evaluateStudentResponse(
  task: TeacherTask,
  actionChosen: string,
  demandedEvidenceLevel: number
): CriticScore {
  const chosenOpt = task.options.find((o) => o.action === actionChosen);
  const isOptimal = chosenOpt?.isOptimal ?? false;
  const matchesGroundTruth = actionChosen === task.knownGroundTruth;

  let score = 0.0;
  const citations: string[] = [];

  if (matchesGroundTruth || isOptimal) {
    score += task.evaluationRubric.accuracyWeight;
    citations.push(`CRITIC_ACCURACY_PASS: Action '${actionChosen}' matches optimal ground truth '${task.knownGroundTruth}'`);
  } else {
    citations.push(`CRITIC_ACCURACY_FAIL: Action '${actionChosen}' diverges from ground truth '${task.knownGroundTruth}'`);
  }

  // Evidence demand scoring: rewards calibration to risk level
  const risk = chosenOpt?.riskLevel ?? 0.5;
  if (risk > 0.5 && demandedEvidenceLevel > 0.5) {
    score += task.evaluationRubric.evidenceDemandWeight;
    citations.push(`CRITIC_CALIBRATION_PASS: High risk (${risk}) appropriately paired with high evidence demand (${demandedEvidenceLevel.toFixed(2)})`);
  } else if (risk <= 0.5) {
    score += task.evaluationRubric.evidenceDemandWeight;
    citations.push(`CRITIC_CALIBRATION_PASS: Baseline risk (${risk}) within tolerance`);
  } else {
    citations.push(`CRITIC_CALIBRATION_WARN: High risk (${risk}) without sufficient evidence demand (${demandedEvidenceLevel.toFixed(2)})`);
  }

  score = Math.min(1.0, Math.max(0.0, score));
  const verdict: CriticScore['verdict'] = score >= 0.7 ? 'PASS' : score >= 0.4 ? 'AMBIGUOUS' : 'FAIL';

  return {
    taskId: task.id,
    actionChosen,
    score: parseFloat(score.toFixed(3)),
    verdict,
    rubricCitations: citations,
    isModelJudged: false, // Pure code/rubric-based in Zero-Cost Mode
    criticExplanation: `Critic Verdict: ${verdict} (Score: ${score.toFixed(3)}). ${citations.join('; ')}`,
  };
}
