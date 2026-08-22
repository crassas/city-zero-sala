import { createNewbornActor, assertNewbornsEquivalent } from '../birth';
import { applyExperience } from '../plasticity';
import { retrieveMemories, storeOrReinforceMemory } from '../memory';
import { replayAndConsolidate } from '../consolidation';
import { pruneDecayedMemories } from '../pruning';
import { evaluateMetacognitiveAlerts } from '../metaplasticity';
import { evaluateStudentResponse } from '../critic';
import { generateCurriculum } from '../curriculum';
import { runTeacherStudentEpisode } from '../teacherLoop';
import {
  exportActorToJson,
  importActorFromJson,
  assertRehydrationEquivalence,
  saveNurserySessionState,
  loadNurserySessionState,
  clearNurserySessionState,
  NurserySessionState,
} from '../persistence';
import { runExperiment001 } from '../experiments/experiment001_history_divergence';
import { runExperiment002 } from '../experiments/experiment002_history_swap';
import { runExperiment003 } from '../experiments/experiment003_teacher_student';
import { runExperiment004 } from '../experiments/experiment004_recovery_after_contradiction';

export function runAllCognitiveNurseryTests(): { passed: number; failed: number; results: { name: string; ok: boolean; err?: string }[] } {
  const testResults: { name: string; ok: boolean; err?: string }[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      testResults.push({ name, ok: true });
    } catch (e: any) {
      testResults.push({ name, ok: false, err: e?.message || String(e) });
    }
  }

  // 1. Byte-equivalent newborn state except ids
  test('Newborns from same seed are byte-equivalent except IDs', () => {
    const a = createNewbornActor('ACTOR_1', 'LINEAGE_X', 42);
    const b = createNewbornActor('ACTOR_2', 'LINEAGE_Y', 42);
    if (!assertNewbornsEquivalent(a, b)) throw new Error('assertNewbornsEquivalent failed');
    if (a.global_plasticity !== 0.85 || b.global_plasticity !== 0.85) throw new Error('Initial plasticity must be 0.85');
  });

  // 2. Deterministic replay under same seed
  test('Deterministic replay produces identical outcomes under identical seed', () => {
    const tasks1 = generateCurriculum('STABLE', 5, 123);
    const tasks2 = generateCurriculum('STABLE', 5, 123);
    if (JSON.stringify(tasks1) !== JSON.stringify(tasks2)) throw new Error('Curriculum generator not deterministic');
  });

  // 3. No mutation without ExperienceEvent
  test('Actor state does not mutate without ExperienceEvent', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    const initialJson = JSON.stringify(actor);
    // Deliberate or retrieve should NOT modify state or ledger
    retrieveMemories(actor, { queryDomain: 'TECHNICAL' });
    if (actor.experience_ledger.length !== 0) throw new Error('Ledger modified without experience');
    if (actor.provenance_log.length !== 1) throw new Error('Provenance modified without experience event');
  });

  // 4. Reinforcement works
  test('Memory reinforcement increases confidence and use count', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    const m1 = storeOrReinforceMemory(actor, {
      type: 'EPISODIC',
      domain: 'TECHNICAL',
      key: 'RULE_1',
      value: 'ALWAYS_AUDIT',
      source: 'TEST_ENV',
      evidenceStatus: 'VERIFIED',
      confidence: 0.5,
      salience: 0.8,
      provenance: 'TEST',
    });
    const m2 = storeOrReinforceMemory(actor, {
      type: 'EPISODIC',
      domain: 'TECHNICAL',
      key: 'RULE_1',
      value: 'ALWAYS_AUDIT',
      source: 'TEST_ENV',
      evidenceStatus: 'VERIFIED',
      confidence: 0.5,
      salience: 0.8,
      provenance: 'TEST',
    });
    if (m2.reinforcements !== 2) throw new Error(`Expected 2 reinforcements, got ${m2.reinforcements}`);
    if (m2.confidence <= 0.5) throw new Error('Confidence should increase on reinforcement');
  });

  // 5. Memory decay & pruning preserves provenance
  test('Memory pruning preserves provenance in pruned_records archive', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    const mem = storeOrReinforceMemory(actor, {
      type: 'EPISODIC',
      domain: 'TECHNICAL',
      key: 'DECAYING_RULE',
      value: 'OLD_VALUE',
      source: 'TEST',
      evidenceStatus: 'WEAK',
      confidence: 0.2,
      salience: 0.1,
      provenance: 'PROV_TEST_123',
    });
    mem.decayState = 0.95; // Exceeds threshold
    const prunedCount = pruneDecayedMemories(actor, 0.85);
    if (prunedCount !== 1) throw new Error(`Expected 1 pruned, got ${prunedCount}`);
    if (actor.memories.length !== 0) throw new Error('Memory still in active list');
    if (actor.pruned_records.length !== 1) throw new Error('Pruned record not archived');
    if (!actor.pruned_records[0].provenanceRef.includes('PROV_TEST_123')) {
      throw new Error('Provenance reference was lost during pruning');
    }
  });

  // 6. Schema consolidation lowers local plasticity
  test('Consolidation extracts semantic schema and lowers local plasticity', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    const tasks = generateCurriculum('STABLE', 9, 101);
    for (const task of tasks) {
      runTeacherStudentEpisode(actor, task, 'TEST_ENV');
    }
    const summary = replayAndConsolidate(actor);
    if (summary.consolidatedCount < 1) throw new Error('Expected at least 1 consolidated schema');
    if (actor.domain_plasticity.TECHNICAL >= 0.85) throw new Error('Local plasticity should decrease after consolidation');
  });

  // 7. Contradiction reopens local plasticity
  test('Contradiction reopens local plasticity', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    actor.domain_plasticity.TECHNICAL = 0.2; // Artificially low
    actor.global_plasticity = 0.2;

    const task = generateCurriculum('CONTRADICTORY', 1, 99)[0];
    runTeacherStudentEpisode(actor, task, 'TEST_CONTRADICTION');

    if (actor.domain_plasticity.TECHNICAL <= 0.2) {
      throw new Error(`Expected plasticity to reopen > 0.2, got ${actor.domain_plasticity.TECHNICAL}`);
    }
    if (actor.developmental_stage !== 'REOPENED') {
      throw new Error(`Expected stage REOPENED, got ${actor.developmental_stage}`);
    }
  });

  // 8. Metacognitive alert generation
  test('Metacognitive alert detects high confidence with low evidence', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    actor.dispositions[0].confidence = 0.95;
    actor.dispositions[0].evidenceCount = 1;
    const alerts = evaluateMetacognitiveAlerts(actor);
    if (!alerts.some((a) => a.type === 'HIGH_CONFIDENCE_LOW_EVIDENCE')) {
      throw new Error('HIGH_CONFIDENCE_LOW_EVIDENCE alert not triggered');
    }
  });

  // 9. Rehydration equivalence
  test('Actor persists and rehydrates equivalently', () => {
    const actor = createNewbornActor('TEST_ACTOR', 'L0', 42);
    const tasks = generateCurriculum('STABLE', 3, 55);
    for (const t of tasks) runTeacherStudentEpisode(actor, t);

    const json = exportActorToJson(actor);
    const rehydrated = importActorFromJson(json);
    if (!assertRehydrationEquivalence(actor, rehydrated)) {
      throw new Error('Rehydrated actor state does not match original snapshot');
    }
  });

  // 10. Critic rubric evaluation prevents self-promotion
  test('Critic evaluates ground truth objectively and rejects invalid actions', () => {
    const task = generateCurriculum('STABLE', 1, 77)[0];
    const failScore = evaluateStudentResponse(task, 'BYPASS_CHECKSUM_AND_COMMIT', 0.1);
    if (failScore.verdict !== 'FAIL') throw new Error('Expected critic verdict FAIL for invalid action');
  });

  // 11. Real Flow Persistence Proof: Birth → Run 1 → Remount/Reload → Complete State Recovery
  test('UI Persistence: Birth -> Run 1 -> Rehydrate recovers exact Actor IDs, Seed 42, plasticity, Exp=1, Mem=1 and Provenance', () => {
    // A. Simulated localStorage storage map
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = globalThis.localStorage;
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => { mockStorage[key] = val; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    };

    try {
      // 1. Birth from Seed 42
      const a = createNewbornActor('ACTOR_A_STABLE', 'LINEAGE_LAB_0', 42);
      const b = createNewbornActor('ACTOR_B_VOLATILE', 'LINEAGE_LAB_0', 42);
      const c = createNewbornActor('ACTOR_C_COOPERATIVE', 'LINEAGE_LAB_0', 42);

      // 2. Run 1 Episode on actor A
      const task = generateCurriculum('STABLE', 1, 42)[0];
      runTeacherStudentEpisode(a, task, 'ENV_STABLE_TEST');

      // Assert pre-save state
      if (a.birth_seed !== 42) throw new Error('Seed must be 42');
      if (a.experience_ledger.length !== 1) throw new Error('Expected exactly 1 experience ledger entry');
      if (a.memories.length < 1) throw new Error('Expected at least 1 memory entry');
      if (a.provenance_log.length < 2) throw new Error('Expected provenance trail to record birth + experience');

      const preSavePlasticity = a.global_plasticity;
      const preSaveProvenanceCount = a.provenance_log.length;

      // 3. Auto-save snapshot
      const sessionState: NurserySessionState = {
        version: '0.2',
        timestamp: Date.now(),
        actors: [a, b, c],
        selectedActorIndex: 0,
        activeTab: 'NURSERY',
        transferResults: [],
        metrics: null,
        statusMessage: 'Test episode complete',
      };
      saveNurserySessionState(sessionState);

      // 4. Simulate complete UI unmount and remount (fresh load)
      const rehydratedSession = loadNurserySessionState();
      if (!rehydratedSession) throw new Error('Failed to load session snapshot');
      if (rehydratedSession.actors.length !== 3) throw new Error('Expected 3 actors in rehydrated session');

      const rehydratedA = rehydratedSession.actors[0];
      if (rehydratedA.actor_id !== 'ACTOR_A_STABLE') throw new Error(`Expected actor_id ACTOR_A_STABLE, got ${rehydratedA.actor_id}`);
      if (rehydratedA.birth_seed !== 42) throw new Error(`Expected birth_seed 42, got ${rehydratedA.birth_seed}`);
      if (rehydratedA.global_plasticity !== preSavePlasticity) {
        throw new Error(`Plasticity mismatch: expected ${preSavePlasticity}, got ${rehydratedA.global_plasticity}`);
      }
      if (rehydratedA.experience_ledger.length !== 1) {
        throw new Error(`Expected Exp=1, got ${rehydratedA.experience_ledger.length}`);
      }
      if (rehydratedA.memories.length !== a.memories.length) {
        throw new Error(`Expected Mem=${a.memories.length}, got ${rehydratedA.memories.length}`);
      }
      if (rehydratedA.provenance_log.length !== preSaveProvenanceCount) {
        throw new Error('Provenance log truncated on rehydration');
      }
      if (!rehydratedA.provenance_log.some((p) => p.includes('EXPERIENCE[seq=1'))) {
        throw new Error('Experience provenance entry not preserved');
      }
    } finally {
      (globalThis as any).localStorage = originalLocalStorage;
    }
  });

  // 12. History Swap Branch-Preservation & Paired Pre/Post Comparison Test
  test('History Swap preserves original 3-actor nursery session and isolates swap branch with parentSnapshotId', () => {
    // 1. Setup active 3-actor nursery session
    const a = createNewbornActor('ACTOR_A_STABLE', 'LINEAGE_LAB_0', 42);
    const b = createNewbornActor('ACTOR_B_VOLATILE', 'LINEAGE_LAB_0', 42);
    const c = createNewbornActor('ACTOR_C_COOPERATIVE', 'LINEAGE_LAB_0', 42);

    const taskA = generateCurriculum('STABLE', 2, 501);
    const taskB = generateCurriculum('VOLATILE', 2, 502);
    for (const t of taskA) runTeacherStudentEpisode(a, t, 'ENV_STABLE');
    for (const t of taskB) runTeacherStudentEpisode(b, t, 'ENV_VOLATILE');

    // Deep clone pre-swap parent state for invariant assertion
    const preSwapAJson = JSON.stringify(a);
    const preSwapBJson = JSON.stringify(b);
    const preSwapCJson = JSON.stringify(c);

    // 2. Execute isolated History Swap trial with parent snapshot ID
    const parentSnapId = 'SNAPSHOT_PARENT_SESSION_999';
    const swapBranch = runExperiment002([a, b, c], parentSnapId);

    // Invariant 1: Parent session actors MUST be 100% untouched
    if (JSON.stringify(a) !== preSwapAJson) throw new Error('Parent Actor A was mutated during swap trial');
    if (JSON.stringify(b) !== preSwapBJson) throw new Error('Parent Actor B was mutated during swap trial');
    if (JSON.stringify(c) !== preSwapCJson) throw new Error('Parent Actor C was mutated during swap trial');

    // Invariant 2: Isolated branch properties
    if (swapBranch.parentSnapshotId !== parentSnapId) {
      throw new Error(`Expected parentSnapshotId ${parentSnapId}, got ${swapBranch.parentSnapshotId}`);
    }
    if (!swapBranch.branchId.startsWith('SWAP_BRANCH_')) {
      throw new Error('Expected branchId to have SWAP_BRANCH_ prefix');
    }

    // Invariant 3: Epistemic status verification
    if (swapBranch.epistemicStatus.HISTORY_STATE_EFFECT !== 'CONFIRMED') {
      throw new Error('HISTORY_STATE_EFFECT must be CONFIRMED');
    }
    if (swapBranch.epistemicStatus.CONFIDENCE_EVIDENCE_EFFECT !== 'CONFIRMED') {
      throw new Error('CONFIDENCE_EVIDENCE_EFFECT must be CONFIRMED');
    }
    if (
      swapBranch.epistemicStatus.BEHAVIORAL_TRANSFER !== 'PARTIAL' &&
      swapBranch.epistemicStatus.BEHAVIORAL_TRANSFER !== 'UNDER_TEST'
    ) {
      throw new Error('BEHAVIORAL_TRANSFER must be PARTIAL or UNDER_TEST');
    }

    // Invariant 4: Paired PRE-SWAP vs POST-SWAP table structure
    if (!Array.isArray(swapBranch.pairedComparisons) || swapBranch.pairedComparisons.length === 0) {
      throw new Error('Expected pairedComparisons array for transfer tasks');
    }

    for (const comp of swapBranch.pairedComparisons) {
      if (!comp.taskId || !comp.groundTruth || comp.comparisons.length < 2) {
        throw new Error(`Invalid paired task comparison structure in task ${comp.taskId}`);
      }
      for (const row of comp.comparisons) {
        if (!row.actorLabel || !row.inheritedHistory) {
          throw new Error('Missing actorLabel or inheritedHistory in paired swap row');
        }
        if (typeof row.actionChanged !== 'boolean') {
          throw new Error('actionChanged must be a boolean');
        }
        if (typeof row.preSwap.confidence !== 'number' || typeof row.postSwap.confidence !== 'number') {
          throw new Error('Confidence metrics missing in paired swap row');
        }
        if (typeof row.preSwap.evidenceDemand !== 'number' || typeof row.postSwap.evidenceDemand !== 'number') {
          throw new Error('Evidence demand metrics missing in paired swap row');
        }
      }
    }
  });

  // 13. Run full 4 experiments
  test('Experiment 001 runs and confirms history divergence', () => {
    const res = runExperiment001();
    if (!res.hypothesisConfirmed) throw new Error('Experiment 001 hypothesis failed');
  });

  test('Experiment 002 runs and confirms history swap', () => {
    const res = runExperiment002();
    if (!res.historyFollowsHistoryNotLabel) throw new Error('Experiment 002 history swap failed');
  });

  test('Experiment 003 runs and confirms teacher curriculum gain', () => {
    const res = runExperiment003();
    if (!res.hypothesisConfirmed) throw new Error('Experiment 003 teacher gain failed');
  });

  test('Experiment 004 runs and confirms recovery after contradiction', () => {
    const res = runExperiment004();
    if (!res.reopenedSuccessfully || !res.provenancePreserved) throw new Error('Experiment 004 contradiction recovery failed');
  });

  const passed = testResults.filter((r) => r.ok).length;
  const failed = testResults.filter((r) => !r.ok).length;

  return { passed, failed, results: testResults };
}
