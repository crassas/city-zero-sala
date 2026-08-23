import { ActorState, ExperienceEvent, TeacherTask, EvidenceStatus } from './types';
import { updateActorWorkspace, deliberateAction } from './workspace';
import { evaluateStudentResponse } from './critic';
import { applyExperience } from './plasticity';
import { RawSignal } from './salience';

export interface EpisodeResult {
  task: TeacherTask;
  actionChosen: string;
  expectedOutcome: string;
  actualOutcome: string;
  criticScore: ReturnType<typeof evaluateStudentResponse>;
  experienceEvent: ExperienceEvent;
  evidenceGatePassed: boolean;
  updatedActorState: ActorState;
}

/**
 * Executes a single Teacher -> Student -> Critic -> Archivist / Update Gate cycle.
 */
export function runTeacherStudentEpisode(
  actor: ActorState,
  task: TeacherTask,
  environmentId: string = 'DEV_NURSERY_ENV'
): EpisodeResult {
  // 1. Ingest Task signals into Student's limited workspace
  const signals: RawSignal[] = task.contextSignals.map((sig, idx) => ({
    id: `SIG_${task.id}_${idx}`,
    source: task.id,
    domain: task.domain,
    content: sig,
    urgency: 0.6,
    noveltyEstimate: 0.5,
  }));

  updateActorWorkspace(actor, signals, 7);

  // 2. Student deliberates action using workspace & retrieved memories
  const deliberation = deliberateAction(
    actor,
    task.options.map((o) => ({
      action: o.action,
      expectedOutcome: o.expectedOutcome,
      riskLevel: o.riskLevel,
    })),
    task.domain
  );

  const chosenAction = deliberation.action;
  const predictedOutcome = deliberation.expectedOutcome;

  // 3. Environment outcome evaluation
  const chosenOpt = task.options.find((o) => o.action === chosenAction);
  const actualOutcome = chosenOpt?.expectedOutcome || 'UNKNOWN_CONSEQUENCE';

  // 4. Critic evaluates student response against explicit rubric
  const criticScore = evaluateStudentResponse(task, chosenAction, actor.evidence_demand_threshold);

  // 5. Evidence Gate (Archivist): Only verified or structured outcomes form developmental experiences
  const isPass = criticScore.verdict === 'PASS';
  const evidenceStatus: EvidenceStatus = isPass ? 'VERIFIED' : 'CONTRADICTED';
  const surprise = isPass ? 0.1 : 0.8;
  const contradictionLevel = isPass ? 0.0 : 0.7;

  const sequence = actor.experience_ledger.length + 1;

  const event: ExperienceEvent = {
    id: `EXP_${task.id}_${Date.now()}_${sequence}`,
    sequence,
    timestamp: Date.now(),
    environmentId,
    domain: task.domain,
    observation: task.description,
    candidateActions: task.options.map((o) => o.action),
    chosenAction,
    predictedOutcome,
    actualOutcome,
    evidenceStatus,
    salience: 0.7,
    novelty: isPass ? 0.3 : 0.75,
    surprise,
    contradictionLevel,
    socialCorroboration: task.domain === 'SOCIAL' ? 0.8 : 0.2,
    criticResult: criticScore,
    confidenceBefore: 0.5,
    confidenceAfter: 0.5,
    plasticityBefore: actor.domain_plasticity[task.domain] ?? actor.global_plasticity,
    plasticityAfter: actor.domain_plasticity[task.domain] ?? actor.global_plasticity,
    affectedDispositions: [],
    provenance: `TEACHER_EPISODE[task=${task.id}, critic_score=${criticScore.score}, verdict=${criticScore.verdict}]`,
  };

  // 6. Developmental update applied to state
  applyExperience(actor, event);

  return {
    task,
    actionChosen: chosenAction,
    expectedOutcome: predictedOutcome,
    actualOutcome,
    criticScore,
    experienceEvent: event,
    evidenceGatePassed: true,
    updatedActorState: actor,
  };
}
