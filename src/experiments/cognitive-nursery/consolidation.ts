import { ActorState, ConsolidatedSchema, Domain, ReplaySummary } from './types';
import { pruneDecayedMemories } from './pruning';

/**
 * Replay & Consolidation phase ("Sleep").
 * Scans episodic and social experiences, identifies repeated verified patterns,
 * extracts consolidated semantic schemas, decays unused memories, and applies pruning.
 */
export function replayAndConsolidate(actor: ActorState): ReplaySummary {
  let consolidatedCount = 0;
  let reopenedCount = 0;
  let decayedCount = 0;

  const now = Date.now();
  const domains: Domain[] = ['TECHNICAL', 'SOCIAL', 'RISK', 'GOVERNANCE'];

  for (const domain of domains) {
    const verifiedEvents = actor.experience_ledger.filter(
      (e) => e.domain === domain && e.evidenceStatus === 'VERIFIED'
    );
    const contradictedEvents = actor.experience_ledger.filter(
      (e) => e.domain === domain && e.evidenceStatus === 'CONTRADICTED'
    );

    // Rule: >= 3 verified experiences justify schema consolidation
    if (verifiedEvents.length >= 3) {
      let existingSchema = actor.consolidated_schemas.find((s) => s.domain === domain);
      if (!existingSchema) {
        existingSchema = {
          id: `SCHEMA-${domain}-${Date.now().toString(36)}`,
          domain,
          skillOrRule: `HEURISTIC_${domain}_VERIFIED_STABLE`,
          policySummary: `Consolidated policy derived from ${verifiedEvents.length} verified observations`,
          consolidationLevel: 0.5,
          sourceExperiences: verifiedEvents.map((e) => `SEQ_${e.sequence}`),
          reopenedCount: 0,
          lastValidated: now,
        };
        actor.consolidated_schemas.push(existingSchema);
        consolidatedCount += 1;
        actor.provenance_log.push(`SCHEMA_CONSOLIDATED[domain=${domain}, id=${existingSchema.id}]`);
      } else {
        existingSchema.consolidationLevel = Math.min(1.0, existingSchema.consolidationLevel + 0.15);
        existingSchema.lastValidated = now;
        existingSchema.sourceExperiences = Array.from(
          new Set([...existingSchema.sourceExperiences, ...verifiedEvents.map((e) => `SEQ_${e.sequence}`)])
        );
      }

      // Consolidation lowers local plasticity in that domain
      const currentPlas = actor.domain_plasticity[domain] ?? 0.85;
      actor.domain_plasticity[domain] = parseFloat(Math.max(0.1, currentPlas - 0.15).toFixed(4));
    }

    // If contradictions are present in a consolidated domain, mark schema challenged
    if (contradictedEvents.length >= 2) {
      const schema = actor.consolidated_schemas.find((s) => s.domain === domain);
      if (schema) {
        schema.reopenedCount += 1;
        schema.consolidationLevel = Math.max(0.1, schema.consolidationLevel - 0.3);
        reopenedCount += 1;
        actor.provenance_log.push(`SCHEMA_CHALLENGED[domain=${domain}, reopened=${schema.reopenedCount}]`);
      }
    }
  }

  // Decay unused memory records
  for (const mem of actor.memories) {
    if (now - mem.lastUsed > 3000) {
      // Memory hasn't been accessed recently
      mem.decayState = Math.min(1.0, mem.decayState + 0.15);
      decayedCount += 1;
    }
  }

  // Prune memories whose decay exceeds safety threshold (0.85)
  const prunedCount = pruneDecayedMemories(actor, 0.85);

  // Recalculate global plasticity
  const avg = domains.reduce((acc, d) => acc + (actor.domain_plasticity[d] ?? 0.5), 0) / domains.length;
  actor.global_plasticity = parseFloat(avg.toFixed(4));

  return {
    replayedExperiences: actor.experience_ledger.length,
    consolidatedCount,
    reopenedCount,
    prunedCount,
    decayedCount,
    updatedPlasticity: actor.global_plasticity,
  };
}
