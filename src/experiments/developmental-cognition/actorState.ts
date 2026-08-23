import { ActorState, Domain } from './types';

export function createInitialActor(id: string): ActorState {
  return {
    actor_id: id,
    developmental_stage: 'INITIAL',
    global_plasticity: 1.0,
    domain_plasticity: {
      SOCIAL: 1.0,
      TECHNICAL: 1.0,
      RISK: 1.0,
      UNKNOWN: 1.0
    },
    dispositions: [],
    salience_weights: {
      SOCIAL: 0.5,
      TECHNICAL: 0.5,
      RISK: 0.5,
      UNKNOWN: 0.5
    },
    priors: {},
    episodic_memory: [],
    consolidated_schemas: [],
    contradictions: 0,
    provenance: [`INIT:${id}:${Date.now()}`]
  };
}
