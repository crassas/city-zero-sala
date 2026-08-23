export type WorkUnitStatus = 'ACTIVE' | 'STALE' | 'BLOCKED' | 'COMPLETED';

export type MissionStatus = 
  | 'CANONICAL_ENTRYPOINT_PENDING'
  | 'PENDING'
  | 'INBOX'
  | 'ROUTED_TO_WORKER'
  | 'WORK_IN_PROGRESS'
  | 'IN_PROGRESS'
  | 'VERIFYING'
  | 'RECEIPT_PENDING'
  | 'HANDOFF_READY'
  | 'COMPLETED'
  | 'FAILED';


export interface CanonicalEntrypoint {
  fileId: string;
  docUrl: string;
  loaded: boolean;
  lastSyncAttempt: string;
}

export interface Mission {
  id: string;
  title: string;
  requiredCapability: string;
  assignedWorker: string;
  status: MissionStatus;
  evidence: string;
  nextRoute: string;
  sourceArtefact: string;
  updatedAt: string;
}

export interface VerificationInfo {
  verifiedBy: string;
  verifiedAt: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
}


export interface WorkUnit {
  id: string; // WU-01 to WU-13
  name: string;
  capability: string;
  assignedAgent: string;
  status: WorkUnitStatus;
  staleState: boolean;
  staleReason?: string;
  ownerGate: boolean;
  gateRequirement?: string;
  evidence: string;
  verification: VerificationInfo;
  nextRoute: string;
}

export interface OwnerGateItem {
  gateId: string;
  description: string;
  status: 'OPEN' | 'LOCKED';
  requiredRole: string;
}

export interface OperationsConsolePayload {
  version: 'operations_console.v0';
  sourceDriveId: string; // 15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w
  sourceName: string;
  adapterBoundary: 'LOCAL_BOOTSTRAP_ADAPTER' | 'DRIVE_LIVE_SYNC';
  isReadOnly: true;
  lastBootstrapAt: string;
  agents: string[];
  workUnits: WorkUnit[];
  ownerGates: OwnerGateItem[];
  staleStateSummary: {
    totalUnits: number;
    staleCount: number;
    activeCount: number;
    blockedCount: number;
  };
}

export interface ProposedAction {
  actionId: string;
  timestamp: string;
  targetWorkUnitId: string;
  targetWorkUnitName: string;
  actionType: 'MUTATION_PROPOSAL' | 'ROUTE_PROPOSAL' | 'EVIDENCE_PROPOSAL' | 'STATUS_PROPOSAL';
  proposedState: {
    status?: WorkUnitStatus;
    evidence?: string;
    nextRoute?: string;
    assignedAgent?: string;
  };
  rationale: string;
  status: 'PROPOSED_ACTION';
}

export interface CapabilityProbe {
  DRIVE_AUTH: 'VERIFIED' | 'BLOCKED' | 'UNKNOWN';
  DRIVE_READ: 'VERIFIED' | 'BLOCKED' | 'UNKNOWN';
  DRIVE_CREATE: 'VERIFIED' | 'BLOCKED' | 'UNKNOWN';
  DRIVE_READBACK: 'VERIFIED' | 'BLOCKED' | 'UNKNOWN';
  error?: string;
}

export interface AdmissionTicket {
  ENTRY_ID: string;
  ACTOR_ID: string;
  MODEL_OR_PROVIDER: string;
  MISSION_ID: string;
  WORK_UNIT_ID: string;
  CLAIMED_AT: number;
  SCOPE: string;
  RETURN_POINT: string;
  ATTEMPT_EPOCH: number;
  AUTHORITY_SCOPE: string;
  RUN_NONCE: string;
}

export interface RuntimeEvent {
  type: 'ADMITTED' | 'CLAIMED' | 'WORKING' | 'RECEIPT_CREATED' | 'READBACK_VERIFIED' | 'BLOCKED' | 'COMPLETED';
  ticket: AdmissionTicket;
  message: string;
  receiptId?: string;
  evidence?: string;
}

export type DriveConnectionState = 'DRIVE_ACCESS_NOT_AVAILABLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
