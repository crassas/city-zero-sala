export type SpineStage = 'INBOX' | 'ROUTE' | 'EXECUTE' | 'VERIFY' | 'SEAL' | 'HANDOFF';

export interface SpineMessageAdapter {
  emit(event: string, payload: any): void;
  listen(event: string, callback: (payload: any) => void): void;
}

export interface AuthorityScope {
  level: 'ROOT' | 'SUPERVISOR' | 'FOUNDER' | 'WORKER' | 'SCOUT';
  permissions: string[];
}

export interface EvidenceGate {
  validate(proofHash: string, payload: any): boolean;
  gateStatus: 'OPEN' | 'LOCKED' | 'AUDIT_REQUIRED';
}

export interface SpineMessage {
  id: string;
  sourceDriveId: string;
  stage: SpineStage;
  payload: Record<string, any>;
  timestamp: string;
  signature: string;
  immutable: boolean;
}

export interface SpineExecutionNode {
  nodeId: string;
  unitId: string;
  name: string;
  agent: string;
  capability: string;
  state: 'IDLE' | 'EXECUTING' | 'VERIFIED' | 'BLOCKED_BY_GATE';
  lastProofHash?: string;
  receiptId?: string;
  authorityScopes?: AuthorityScope[];
  evidenceGate?: EvidenceGate;
  isSupervisor?: boolean;
}

export interface AdversarialTestResult {
  testId: string;
  vector: string;
  description: string;
  expectedOutcome: 'BLOCKED' | 'REJECTED' | 'ISOLATED' | 'VERIFIED';
  actualOutcome: 'BLOCKED' | 'REJECTED' | 'ISOLATED' | 'VERIFIED';
  passed: boolean;
  tamperDetected: boolean;
  evidence: string;
}

export interface SpineRuntimeReceipt {
  receipt_version: 'spine.runtime.v1';
  target_drive_id: string;
  timestamp: string;
  tree_materialized: {
    nodes_count: number;
    directories: string[];
    files_created: string[];
  };
  stages_completed: SpineStage[];
  test_suite: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
  };
  adversarial_pass: {
    vectors_tested: number;
    vectors_neutralized: number;
    constitution_integrity_preserved: boolean;
    tamper_resistance_status: 'PASS_IMMUTABLE';
  };
  cryptographic_seal: {
    algorithm: 'SHA256';
    merkle_root: string;
    seal_signature: string;
  };
  drive_deposit_status: 'DEPOSITED_LOCAL_AND_QUEUED_FOR_DRIVE';
}
