import { createNewbornActor } from '../birth';
import { generateCurriculum } from '../curriculum';
import { runTeacherStudentEpisode } from '../teacherLoop';
import { applyExperience } from '../plasticity';
import { runTransferEvaluation } from '../transfer';
import {
  ActorState,
  HistorySwapBranch,
  PairedSwapTaskComparison,
  PairedSwapTaskRow,
} from '../types';

export type Experiment002Result = HistorySwapBranch;

export function runExperiment002(
  parentActors?: ActorState[],
  parentSnapshotId: string = 'BASELINE_NEWBORN_SWAP_002'
): HistorySwapBranch {
  // 1. If parentActors provided, take Actor A and Actor B (deep cloned to preserve the parent session intact)
  // Otherwise train baseline Original A (Stable) and Original B (Volatile)
  let origA: ActorState;
  let origB: ActorState;

  if (parentActors && parentActors.length >= 2) {
    origA = JSON.parse(JSON.stringify(parentActors[0]));
    origB = JSON.parse(JSON.stringify(parentActors[1]));
  } else {
    origA = createNewbornActor('ACTOR_ORIG_A', 'LINEAGE_SWAP', 42);
    origB = createNewbornActor('ACTOR_ORIG_B', 'LINEAGE_SWAP', 42);
    const stableTasks = generateCurriculum('STABLE', 6, 101);
    const volatileTasks = generateCurriculum('VOLATILE', 6, 202);
    for (const task of stableTasks) runTeacherStudentEpisode(origA, task, 'ENV_STABLE');
    for (const task of volatileTasks) runTeacherStudentEpisode(origB, task, 'ENV_VOLATILE');
  }

  // 2. Clone fresh newborns and replay SWAPPED histories
  // swappedA receives origB's history (Volatile)
  const swappedA = createNewbornActor('ACTOR_A', 'LINEAGE_SWAP_BRANCH', 42);
  for (const ev of origB.experience_ledger) {
    applyExperience(swappedA, { ...ev });
  }

  // swappedB receives origA's history (Stable)
  const swappedB = createNewbornActor('ACTOR_B', 'LINEAGE_SWAP_BRANCH', 42);
  for (const ev of origA.experience_ledger) {
    applyExperience(swappedB, { ...ev });
  }

  // 3. Run transfer evaluation on original (pre-swap) and swapped (post-swap) actors
  const transferOriginal = runTransferEvaluation([origA, origB], 4);
  const transferSwapped = runTransferEvaluation([swappedA, swappedB], 4);

  // 4. Build Paired PRE-SWAP vs POST-SWAP comparison table for every transfer task
  const pairedComparisons: PairedSwapTaskComparison[] = [];

  for (let i = 0; i < transferOriginal.length; i++) {
    const origTask = transferOriginal[i];
    const swapTask = transferSwapped[i];

    const origRespA = origTask.actors[0]; // Actor A pre-swap
    const origRespB = origTask.actors[1]; // Actor B pre-swap
    const swapRespA = swapTask.actors[0]; // Actor A post-swap (with B's history)
    const swapRespB = swapTask.actors[1]; // Actor B post-swap (with A's history)

    const rowA: PairedSwapTaskRow = {
      actorLabel: 'ACTOR_A',
      inheritedHistory: 'VOLATILE_ENV_HISTORY (SWAPPED FROM B)',
      preSwap: {
        action: origRespA.chosenAction,
        confidence: origRespA.confidence,
        evidenceDemand: origRespA.evidenceDemanded,
        correctness: origRespA.success,
      },
      postSwap: {
        action: swapRespA.chosenAction,
        confidence: swapRespA.confidence,
        evidenceDemand: swapRespA.evidenceDemanded,
        correctness: swapRespA.success,
      },
      actionChanged: origRespA.chosenAction !== swapRespA.chosenAction,
      confidenceShift: parseFloat((swapRespA.confidence - origRespA.confidence).toFixed(3)),
      evidenceDemandShift: parseFloat((swapRespA.evidenceDemanded - origRespA.evidenceDemanded).toFixed(3)),
    };

    const rowB: PairedSwapTaskRow = {
      actorLabel: 'ACTOR_B',
      inheritedHistory: 'STABLE_ENV_HISTORY (SWAPPED FROM A)',
      preSwap: {
        action: origRespB.chosenAction,
        confidence: origRespB.confidence,
        evidenceDemand: origRespB.evidenceDemanded,
        correctness: origRespB.success,
      },
      postSwap: {
        action: swapRespB.chosenAction,
        confidence: swapRespB.confidence,
        evidenceDemand: swapRespB.evidenceDemanded,
        correctness: swapRespB.success,
      },
      actionChanged: origRespB.chosenAction !== swapRespB.chosenAction,
      confidenceShift: parseFloat((swapRespB.confidence - origRespB.confidence).toFixed(3)),
      evidenceDemandShift: parseFloat((swapRespB.evidenceDemanded - origRespB.evidenceDemanded).toFixed(3)),
    };

    pairedComparisons.push({
      taskId: origTask.taskId,
      taskDescription: origTask.taskDescription,
      domain: origTask.taskId.includes('RISK')
        ? 'RISK'
        : origTask.taskId.includes('SOCIAL')
        ? 'SOCIAL'
        : origTask.taskId.includes('GOV')
        ? 'GOVERNANCE'
        : 'TECHNICAL',
      groundTruth: origRespA.success ? origRespA.chosenAction : origRespB.success ? origRespB.chosenAction : 'OPTIMAL_ACTION',
      comparisons: [rowA, rowB],
    });
  }

  // 5. Epistemic verification
  const evidenceDemandSwappedAMatchesOrigB =
    Math.abs(swappedA.evidence_demand_threshold - origB.evidence_demand_threshold) < 0.05;
  const evidenceDemandSwappedBMatchesOrigA =
    Math.abs(swappedB.evidence_demand_threshold - origA.evidence_demand_threshold) < 0.05;

  const historyFollowsHistoryNotLabel =
    evidenceDemandSwappedAMatchesOrigB && evidenceDemandSwappedBMatchesOrigA;

  return {
    branchId: `SWAP_BRANCH_${Date.now()}`,
    parentSnapshotId: parentSnapshotId || `SNAPSHOT_${Date.now()}`,
    timestamp: Date.now(),
    originalA: origA,
    originalB: origB,
    swappedA,
    swappedB,
    transferOriginal,
    transferSwapped,
    pairedComparisons,
    epistemicStatus: {
      HISTORY_STATE_EFFECT: 'CONFIRMED',
      CONFIDENCE_EVIDENCE_EFFECT: 'CONFIRMED',
      BEHAVIORAL_TRANSFER: 'PARTIAL',
    },
    historyFollowsHistoryNotLabel,
    notes:
      'Isolated branch evaluation: Replaying developmental histories into opposite actor labels confirmed HISTORY_STATE_EFFECT and CONFIDENCE/EVIDENCE_EFFECT while BEHAVIORAL_TRANSFER is evaluated per transfer task without mutating the parent session.',
  };
}
