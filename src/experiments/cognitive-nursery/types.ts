export type Domain = 'TECHNICAL' | 'SOCIAL' | 'RISK' | 'GOVERNANCE' | 'UNKNOWN';

export type EvidenceStatus = 'OBSERVED' | 'VERIFIED' | 'CONTRADICTED' | 'WEAK' | 'PRUNED';

export type DevelopmentalStage = 'INITIAL' | 'EXPLORATORY' | 'LEARNING' | 'STABILISING' | 'CONSOLIDATED' | 'CHALLENGED' | 'REOPENED';

export type MemoryStoreType = 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL' | 'SELF_MODEL' | 'SOCIAL_TESTIMONY' | 'DISPUTED' | 'EPHEMERAL_WORKSPACE';

export interface WorkspaceItem {
  id: string;
  source: string;
  domain: Domain;
  content: string;
  salienceScore: number;
  entryReason: string;
  admittedAt: number;
}

export interface RejectedWorkspaceCandidate {
  id: string;
  source: string;
  domain: Domain;
  content: string;
  salienceScore: number;
  rejectionReason: string;
}

export interface MemoryRecord {
  id: string;
  type: MemoryStoreType;
  domain: Domain;
  key: string;
  value: string;
  source: string;
  evidenceStatus: EvidenceStatus;
  confidence: number; // 0 to 1
  salience: number; // 0 to 1
  useCount: number;
  lastUsed: number;
  reinforcements: number;
  contradictionCount: number;
  decayState: number; // 0 (active) to 1 (fully decayed)
  provenance: string;
}

export interface Disposition {
  domain: Domain;
  belief: string;
  policy: string; // Action heuristic
  confidence: number; // 0 to 1
  evidenceCount: number;
  evidenceDemandThreshold: number; // How much evidence actor demands before taking risk (0 to 1)
  lastUpdated: number;
}

export interface ConsolidatedSchema {
  id: string;
  domain: Domain;
  skillOrRule: string;
  policySummary: string;
  consolidationLevel: number; // 0 to 1
  sourceExperiences: string[];
  reopenedCount: number;
  lastValidated: number;
}

export interface PrunedRecord {
  id: string;
  originalType: string;
  summary: string;
  prunedAt: number;
  reason: string;
  provenanceRef: string;
}

export interface SelfModelClaim {
  aspect: string;
  observedCapacity: string;
  evidenceIds: string[];
  confidence: number;
  lastVerified: number;
}

export interface ExperienceEvent {
  id: string;
  sequence: number;
  timestamp: number;
  environmentId: string;
  domain: Domain;
  observation: string;
  candidateActions: string[];
  chosenAction: string;
  predictedOutcome: string;
  actualOutcome: string;
  evidenceStatus: EvidenceStatus;
  salience: number;
  novelty: number;
  surprise: number; // Prediction error
  contradictionLevel: number;
  socialCorroboration: number;
  criticResult?: CriticScore;
  confidenceBefore: number;
  confidenceAfter: number;
  plasticityBefore: number;
  plasticityAfter: number;
  affectedDispositions: string[];
  provenance: string;
}

export type MetacognitiveAlertType =
  | 'HIGH_CONFIDENCE_LOW_EVIDENCE'
  | 'STALE_SCHEMA'
  | 'CONTRADICTION_ACCUMULATING'
  | 'OVERFIT_TO_RECENT_HISTORY'
  | 'PLASTICITY_COLLAPSE'
  | 'EXCESSIVE_PLASTICITY';

export interface MetacognitiveAlert {
  type: MetacognitiveAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  domain?: Domain;
  detail: string;
  timestamp: number;
}

export interface ActorState {
  actor_id: string;
  lineage_id: string;
  generation: number;
  birth_seed: number;
  developmental_stage: DevelopmentalStage;
  global_plasticity: number; // 0.0 to 1.0
  domain_plasticity: Record<Domain, number>;
  metaplasticity_rate: number; // Multiplier determining how easily plasticity changes
  salience_weights: Record<Domain, number>;
  priors: Record<string, string>;
  dispositions: Disposition[];
  confidence_calibration_error: number;
  evidence_demand_threshold: number;
  contradiction_sensitivity: number;
  risk_tolerance_proxy: number;
  novelty_sensitivity: number;
  memories: MemoryRecord[];
  active_workspace: WorkspaceItem[];
  rejected_candidates_audit: RejectedWorkspaceCandidate[];
  consolidated_schemas: ConsolidatedSchema[];
  pruned_records: PrunedRecord[];
  self_model: SelfModelClaim[];
  experience_ledger: ExperienceEvent[];
  alerts: MetacognitiveAlert[];
  contradictions_count: number;
  provenance_log: string[];
  parent_teacher_relation?: string;
}

export interface TeacherTask {
  id: string;
  domain: Domain;
  taskType: 'PREDICTION' | 'TRANSFER' | 'DISPUTED_CORROBORATION' | 'EDGE_CASE';
  description: string;
  contextSignals: string[];
  options: { action: string; expectedOutcome: string; isOptimal: boolean; riskLevel: number }[];
  knownGroundTruth: string;
  evaluationRubric: {
    accuracyWeight: number;
    evidenceDemandWeight: number;
    explanation: string;
  };
}

export interface CriticScore {
  taskId: string;
  actionChosen: string;
  score: number; // 0 to 1
  verdict: 'PASS' | 'FAIL' | 'AMBIGUOUS';
  rubricCitations: string[];
  isModelJudged: boolean;
  criticExplanation: string;
}

export interface ReplaySummary {
  replayedExperiences: number;
  consolidatedCount: number;
  reopenedCount: number;
  prunedCount: number;
  decayedCount: number;
  updatedPlasticity: number;
}

export interface TransferComparisonResult {
  taskId: string;
  taskDescription: string;
  actors: {
    actor_id: string;
    chosenAction: string;
    evidenceDemanded: number;
    confidence: number;
    predictedOutcome: string;
    success: boolean;
    retrievedMemoriesCount: number;
    activeDispositions: string[];
    plasticityAtTest: number;
  }[];
  divergenceScore: number;
}

export interface ScientificMetrics {
  stateDivergenceDistance: number;
  policyDivergence: number;
  evidenceDemandDelta: number;
  confidenceCalibrationError: number;
  contradictionRecoveryTime: number;
  localPlasticityTrajectory: number[];
  memoryRetrievalOverlap: number;
  consolidationCount: number;
  prunedCount: number;
  transferSuccessRate: number;
  provenanceCompleteness: number; // 1.0 = 100% complete
  teacherCurriculumGainVsRandom: number;
}

export interface PairedSwapTaskRow {
  actorLabel: string;
  inheritedHistory: string;
  preSwap: {
    action: string;
    confidence: number;
    evidenceDemand: number;
    correctness: boolean;
  };
  postSwap: {
    action: string;
    confidence: number;
    evidenceDemand: number;
    correctness: boolean;
  };
  actionChanged: boolean;
  confidenceShift: number;
  evidenceDemandShift: number;
}

export interface PairedSwapTaskComparison {
  taskId: string;
  taskDescription: string;
  domain: Domain;
  groundTruth: string;
  comparisons: PairedSwapTaskRow[];
}

export interface HistorySwapBranch {
  branchId: string;
  parentSnapshotId: string;
  timestamp: number;
  originalA: ActorState;
  originalB: ActorState;
  swappedA: ActorState; // Actor with ID A playing B's history
  swappedB: ActorState; // Actor with ID B playing A's history
  transferOriginal: TransferComparisonResult[];
  transferSwapped: TransferComparisonResult[];
  pairedComparisons: PairedSwapTaskComparison[];
  epistemicStatus: {
    HISTORY_STATE_EFFECT: 'CONFIRMED';
    CONFIDENCE_EVIDENCE_EFFECT: 'CONFIRMED';
    BEHAVIORAL_TRANSFER: 'PARTIAL' | 'UNDER_TEST';
  };
  historyFollowsHistoryNotLabel: boolean;
  notes: string;
}
