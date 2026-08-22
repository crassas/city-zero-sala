import { OperationsConsolePayload } from '../types';

export const CANONICAL_DRIVE_FILE_ID = "15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w";
export const CANONICAL_FILE_NAME = "operations_console.v0";


export const OPERATIONS_CONSOLE_V0_PAYLOAD: OperationsConsolePayload = {
  version: "operations_console.v0",
  sourceDriveId: CANONICAL_DRIVE_FILE_ID,
  sourceName: CANONICAL_FILE_NAME,
  adapterBoundary: "LOCAL_BOOTSTRAP_ADAPTER",
  isReadOnly: true,
  lastBootstrapAt: "2026-08-19T09:12:00Z",
  agents: ["OWNER", "CHATGPT", "CLAUDE"],
  staleStateSummary: {
    totalUnits: 13,
    staleCount: 1, // WU-03 waiting for OAuth Drive token
    activeCount: 10,
    blockedCount: 2 // WU-02 & WU-08 (Owner Gates)
  },
  ownerGates: [
    {
      gateId: "GATE-01-CONSTITUTION",
      description: "Constitutional Document Mutation Lock",
      status: "LOCKED",
      requiredRole: "SYSTEM_OWNER"
    },
    {
      gateId: "GATE-02-DISPATCH",
      description: "Downstream Worker Dispatch Authorization",
      status: "OPEN",
      requiredRole: "ROUTER_AGENT"
    },
    {
      gateId: "GATE-03-CREDENTIALS",
      description: "Paid Infrastructure Exemption Guard",
      status: "LOCKED",
      requiredRole: "FREE_FIRST_AUDITOR"
    }
  ],
  workUnits: [
    {
      id: "WU-01",
      name: "RECOVERY_REGISTRY_HYDRATION",
      capability: "Status Recovery Registry Sync",
      assignedAgent: "OWNER",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "GRAPH_BRAIN_OPERATIONAL_STATUS_RECOVERY_REGISTRY v1 populated. FAST ENTRY rules verified and active.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-02"
    },
    {
      id: "WU-02",
      name: "CONSTITUTIONAL_BOUNDARY_AUDIT",
      capability: "Constitutional & Non-Destructive Guard",
      assignedAgent: "CLAUDE",
      status: "BLOCKED",
      staleState: false,
      ownerGate: true,
      gateRequirement: "Requires OWNER_GATE Constitution Mutation Token for write operations.",
      evidence: "Zero constitutional files altered. Boundary checks passing with 100% compliance.",
      verification: {
        verifiedBy: "SECURITY_SEAL_V1",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-03"
    },
    {
      id: "WU-03",
      name: "DRIVE_ADAPTER_HANDSHAKE",
      capability: "Drive Scope Adapter & Token Boundary",
      assignedAgent: "CHATGPT",
      status: "BLOCKED",
      staleState: true,
      staleReason: "DRIVE_ACCESS_NOT_AVAILABLE. Operating safely over local bootstrap adapter boundary.",
      ownerGate: false,
      evidence: "Adapter boundary active. Awaiting OAuth token grant without pretending live connection.",
      verification: {
        verifiedBy: "ADAPTER_MONITOR",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "UNVERIFIED"
      },
      nextRoute: "WU-04"
    },
    {
      id: "WU-04",
      name: "ECOSYSTEM_ROUTER_PIPELINE",
      capability: "6-Stage Mission Router & Dispatch",
      assignedAgent: "OWNER",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "Pipeline sequence verified: INBOX -> ROUTE -> RESULT -> VERIFY -> RECEIPT -> HANDOFF.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-05"
    },
    {
      id: "WU-05",
      name: "WORKER_CAPABILITY_REGISTRY",
      capability: "Capability Match & Allocation Engine",
      assignedAgent: "CLAUDE",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "Worker capability taxonomy indexed across 13 operational units.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-06"
    },
    {
      id: "WU-06",
      name: "EVIDENCE_TRAIL_VERIFIER",
      capability: "Immutable Evidence Audit & Cryptographic Hashing",
      assignedAgent: "CHATGPT",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "Evidence SHA256 signatures generated for all active work unit outputs.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-07"
    },
    {
      id: "WU-07",
      name: "RECEIPT_TRANSACTION_SEALER",
      capability: "Receipt Handoff & PROPOSED_ACTION Enforcer",
      assignedAgent: "OWNER",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "PROPOSED_ACTION mutation wrapper active. RUN_LONG_RECEIPT.json generated.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-08"
    },
    {
      id: "WU-08",
      name: "OWNER_GATE_AUTHORIZATION",
      capability: "Owner Security & Critical Gate Check",
      assignedAgent: "CLAUDE",
      status: "BLOCKED",
      staleState: false,
      ownerGate: true,
      gateRequirement: "Requires explicit owner credential token for GATE-01 mutation.",
      evidence: "Gate locked. Non-owner state mutations rejected.",
      verification: {
        verifiedBy: "GATE_SECURITY_UNIT",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-09"
    },
    {
      id: "WU-09",
      name: "STALE_STATE_RECOVERY_ENGINE",
      capability: "Self-Healing State Recovery & Cache Invalidation",
      assignedAgent: "CHATGPT",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "Stale state detector resolved eligible units. 10 of 13 units fully verified.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-10"
    },
    {
      id: "WU-10",
      name: "INTERACTION_PROPOSAL_QUEUE",
      capability: "Read-Only PROPOSED_ACTION Proposal Buffer",
      assignedAgent: "OWNER",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "Proposal queue operational. Interventions formatted as PROPOSED_ACTION payloads.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-11"
    },
    {
      id: "WU-11",
      name: "GRAPH_BRAIN_SYNC_BRIDGE",
      capability: "Universal Graph Brain Protocol",
      assignedAgent: "CLAUDE",
      status: "COMPLETED",
      staleState: false,
      ownerGate: false,
      evidence: "Brain bridge initialized over local operations_console.v0 bootstrap payload.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-12"
    },
    {
      id: "WU-12",
      name: "FREE_FIRST_RESOURCE_AUDITOR",
      capability: "Zero-Subscription Capability Guard",
      assignedAgent: "CHATGPT",
      status: "COMPLETED",
      staleState: false,
      ownerGate: true,
      gateRequirement: "Zero paid API or subscription services allowed.",
      evidence: "100% open-source / native Google capabilities utilized. Cost = $0.00.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "WU-13"
    },
    {
      id: "WU-13",
      name: "HANDOFF_DISPATCH_GATEWAY",
      capability: "Downstream Unit Handshake & Receipt Dispatch",
      assignedAgent: "OWNER",
      status: "COMPLETED",
      staleState: false,
      ownerGate: true,
      gateRequirement: "Requires signed transaction receipt before downstream dispatch.",
      evidence: "RUN_LONG_RECEIPT.json and RUN_LONG_MANIFEST.json dispatched to local checkpoint.",
      verification: {
        verifiedBy: "GROCER_AUTONOMOUS_RUN",
        verifiedAt: "2026-08-19T09:12:00Z",
        status: "VERIFIED"
      },
      nextRoute: "TERMINAL_HANDOFF_RECEPTOR"
    }
  ]
};
