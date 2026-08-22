import { ActorState, PrunedRecord } from './types';

/**
 * Prunes decayed or invalidated memories while strictly preserving audit provenance.
 * Never deletes provenance logs; moves retired memory records to pruned_records archive.
 */
export function pruneDecayedMemories(actor: ActorState, decayThreshold: number = 0.8): number {
  let prunedCount = 0;
  const remainingMemories = [];

  for (const mem of actor.memories) {
    if (mem.decayState >= decayThreshold || mem.evidenceStatus === 'PRUNED') {
      const prunedRecord: PrunedRecord = {
        id: mem.id,
        originalType: mem.type,
        summary: `PRUNED[key=${mem.key}, decay=${mem.decayState.toFixed(2)}, status=${mem.evidenceStatus}]`,
        prunedAt: Date.now(),
        reason: mem.decayState >= decayThreshold ? 'EXCESSIVE_DECAY' : 'MANUAL_DEPRECATION',
        provenanceRef: mem.provenance,
      };

      actor.pruned_records.push(prunedRecord);
      actor.provenance_log.push(`MEMORY_PRUNED[id=${mem.id}, ref=${mem.provenance}]`);
      prunedCount += 1;
    } else {
      remainingMemories.push(mem);
    }
  }

  actor.memories = remainingMemories;
  return prunedCount;
}
