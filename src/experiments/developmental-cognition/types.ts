export type Domain = 'SOCIAL' | 'TECHNICAL' | 'RISK' | 'UNKNOWN';
export type EvidenceStatus = 'OBSERVED' | 'VERIFIED' | 'CONTRADICTED' | 'WEAK';

export interface Experience {
  id: string;
  timestamp: number;
  domain: Domain;
  observation: string;
  action: string;
  expectedOutcome: string;
  actualOutcome: string;
  novelty: number; // 0 to 1
  salience: number; // 0 to 1
  contradiction: boolean;
  confidenceDelta: number;
  evidenceStatus: EvidenceStatus;
  provenance: string; // Hash or receipt link
}

export interface Disposition {
  domain: Domain;
  belief: string;
  confidence: number; // 0 to 1
  evidenceCount: number;
  lastUpdated: number;
}

export interface ConsolidatedSchema {
  domain: Domain;
  skillOrRule: string;
  consolidationLevel: number; // 0 to 1
  sourceExperiences: string[]; // Experience IDs
}

export interface ActorState {
  actor_id: string;
  developmental_stage: 'INITIAL' | 'EXPLORATORY' | 'CONSOLIDATING' | 'STABLE';
  global_plasticity: number; // 0 to 1
  domain_plasticity: Record<Domain, number>;
  dispositions: Disposition[];
  salience_weights: Record<Domain, number>;
  priors: Record<string, string>; // Expected patterns
  episodic_memory: Experience[];
  consolidated_schemas: ConsolidatedSchema[];
  contradictions: number; // Count of unresolved contradictions
  provenance: string[]; // Log of state updates
}
