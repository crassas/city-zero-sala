import { ActorState, Experience, Disposition, ConsolidatedSchema, Domain } from './types';

// Constants for state updates
const PLASTICITY_DECAY = 0.05;
const NOVELTY_BUMP = 0.15;
const CONTRADICTION_BUMP = 0.25;
const CONSOLIDATION_THRESHOLD = 3;
const DISPOSITION_DECAY_RATE = 0.02;

export function processExperience(state: ActorState, exp: Experience): ActorState {
  const next = { ...state, episodic_memory: [...state.episodic_memory, exp] };
  
  // 4. Strong novelty/contradiction/prediction failure may reopen local plasticity
  if (exp.contradiction) {
    next.contradictions += 1;
    next.domain_plasticity[exp.domain] = Math.min(1.0, next.domain_plasticity[exp.domain] + CONTRADICTION_BUMP);
    next.global_plasticity = Math.min(1.0, next.global_plasticity + (CONTRADICTION_BUMP * 0.5));
    next.provenance.push(`PLASTICITY_REOPEN:CONTRADICTION:${exp.id}`);
  } else if (exp.novelty > 0.7) {
    next.domain_plasticity[exp.domain] = Math.min(1.0, next.domain_plasticity[exp.domain] + NOVELTY_BUMP);
    next.provenance.push(`PLASTICITY_BUMP:NOVELTY:${exp.id}`);
  }

  // 1. Verified repeated outcomes may reinforce dispositions
  if (exp.evidenceStatus === 'VERIFIED') {
    const existingDispIndex = next.dispositions.findIndex(d => d.domain === exp.domain && d.belief === exp.expectedOutcome);
    if (existingDispIndex >= 0) {
      const disp = { ...next.dispositions[existingDispIndex] };
      disp.evidenceCount += 1;
      disp.confidence = Math.min(1.0, disp.confidence + (exp.confidenceDelta * next.domain_plasticity[exp.domain]));
      disp.lastUpdated = exp.timestamp;
      next.dispositions[existingDispIndex] = disp;
      next.provenance.push(`DISPOSITION_REINFORCED:${exp.domain}:${disp.belief}`);

      // 3. Repeated corroborated competence may consolidate and reduce local plasticity
      if (disp.evidenceCount >= CONSOLIDATION_THRESHOLD && disp.confidence > 0.8) {
        const schemaExists = next.consolidated_schemas.some(s => s.skillOrRule === disp.belief);
        if (!schemaExists) {
            next.consolidated_schemas.push({
                domain: exp.domain,
                skillOrRule: disp.belief,
                consolidationLevel: disp.confidence,
                sourceExperiences: [exp.id] // Simplified provenance for demo
            });
            // Reduce plasticity on consolidation
            next.domain_plasticity[exp.domain] = Math.max(0.1, next.domain_plasticity[exp.domain] - PLASTICITY_DECAY * 2);
            next.provenance.push(`SCHEMA_CONSOLIDATED:${exp.domain}:${disp.belief}`);
            
            if (next.developmental_stage === 'INITIAL' || next.developmental_stage === 'EXPLORATORY') {
                next.developmental_stage = 'CONSOLIDATING';
            }
        }
      }

    } else {
      next.dispositions.push({
        domain: exp.domain,
        belief: exp.actualOutcome, // Or expected if they match
        confidence: 0.5 * next.domain_plasticity[exp.domain],
        evidenceCount: 1,
        lastUpdated: exp.timestamp
      });
      next.provenance.push(`DISPOSITION_CREATED:${exp.domain}:${exp.actualOutcome}`);
    }
  }

  // 2. Weak/unused/contradicted dispositions may decay
  if (exp.contradiction) {
     const dispIndex = next.dispositions.findIndex(d => d.domain === exp.domain && d.belief === exp.expectedOutcome);
     if (dispIndex >= 0) {
         const disp = { ...next.dispositions[dispIndex] };
         disp.confidence = Math.max(0, disp.confidence - exp.confidenceDelta);
         if (disp.confidence < 0.1) {
             next.dispositions.splice(dispIndex, 1);
             next.provenance.push(`DISPOSITION_DROPPED:${exp.domain}:${disp.belief}`);
         } else {
             next.dispositions[dispIndex] = disp;
             next.provenance.push(`DISPOSITION_WEAKENED:${exp.domain}:${disp.belief}`);
         }
     }
  }

  // General passive decay for unreinforced dispositions (simulated on each update)
  next.dispositions = next.dispositions.map(d => {
      if (d.lastUpdated < exp.timestamp - 1000) { // arbitrary time diff for simulation
         return { ...d, confidence: Math.max(0, d.confidence - DISPOSITION_DECAY_RATE) }
      }
      return d;
  }).filter(d => d.confidence > 0);

  // Gradual global plasticity decay if no contradictions
  if (!exp.contradiction) {
    next.global_plasticity = Math.max(0.2, next.global_plasticity - (PLASTICITY_DECAY * 0.1));
    next.domain_plasticity[exp.domain] = Math.max(0.1, next.domain_plasticity[exp.domain] - (PLASTICITY_DECAY * 0.5));
  }

  return next;
}
