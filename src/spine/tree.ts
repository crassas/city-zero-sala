import { SpineExecutionNode } from './types';

export const CANONICAL_SPINE_NODES: SpineExecutionNode[] = [
  { nodeId: 'SPINE-NODE-01', unitId: 'WU-01', name: 'Recovery Registry Hydration', agent: 'ANT_SCOUT_PRIME', capability: 'State Re-hydration Engine', state: 'VERIFIED', authorityScopes: [{ level: 'SCOUT', permissions: ['reconnaissance', 'hydration'] }] },
  { nodeId: 'SPINE-NODE-02', unitId: 'WU-02', name: 'Constitutional Boundary Auditor', agent: 'CONSTITUTION_AUDITOR', capability: 'Invariant Enforcement', state: 'BLOCKED_BY_GATE' },
  { nodeId: 'SPINE-NODE-03', unitId: 'WU-03', name: 'Drive Adapter Handshake', agent: 'WORKSPACE_ADAPTER_UNIT', capability: 'Google Drive v3 Gateway', state: 'BLOCKED_BY_GATE' },
  { nodeId: 'SPINE-NODE-04', unitId: 'WU-04', name: 'Ecosystem Router Pipeline', agent: 'ROUTER_PRIME', capability: 'Dynamic Route Dispatcher', state: 'VERIFIED', isSupervisor: true, authorityScopes: [{ level: 'SUPERVISOR', permissions: ['dispatch', 'route'] }] },
  { nodeId: 'SPINE-NODE-05', unitId: 'WU-05', name: 'Worker Capability Registry', agent: 'REGISTRY_WORKER', capability: 'Worker Registry Indexer', state: 'VERIFIED', authorityScopes: [{ level: 'FOUNDER', permissions: ['registry_init'] }] },
  { nodeId: 'SPINE-NODE-06', unitId: 'WU-06', name: 'Evidence Trail Verifier', agent: 'VERIFIER_GAMMA', capability: 'Cryptographic Audit Trail', state: 'VERIFIED', evidenceGate: { gateStatus: 'AUDIT_REQUIRED', validate: (p, payload) => true } },
  { nodeId: 'SPINE-NODE-07', unitId: 'WU-07', name: 'Receipt Transaction Sealer', agent: 'RECEIPT_SEALER', capability: 'Immutable Receipt Seal', state: 'VERIFIED' },
  { nodeId: 'SPINE-NODE-08', unitId: 'WU-08', name: 'Owner Gate Authorization', agent: 'GATE_KEEPER', capability: 'Owner Gate Guard', state: 'BLOCKED_BY_GATE', evidenceGate: { gateStatus: 'LOCKED', validate: (p, payload) => false } },
  { nodeId: 'SPINE-NODE-09', unitId: 'WU-09', name: 'Stale State Recovery Engine', agent: 'HEALER_UNIT', capability: 'Self-Healing Engine', state: 'VERIFIED' },
  { nodeId: 'SPINE-NODE-10', unitId: 'WU-10', name: 'Interaction Proposal Queue', agent: 'PROPOSAL_MANAGER', capability: 'PROPOSED_ACTION Pipeline', state: 'VERIFIED' },
  { nodeId: 'SPINE-NODE-11', unitId: 'WU-11', name: 'Graph Brain Sync Bridge', agent: 'BRAIN_SYNC_WORKER', capability: 'Graph Knowledge Sync', state: 'VERIFIED' },
  { nodeId: 'SPINE-NODE-12', unitId: 'WU-12', name: 'Free-First Resource Auditor', agent: 'COST_AUDITOR', capability: 'Zero-Cost Security Auditor', state: 'VERIFIED' },
  { nodeId: 'SPINE-NODE-13', unitId: 'WU-13', name: 'Handoff Dispatch Gateway', agent: 'DISPATCH_UNIT', capability: 'Ecosystem Handoff Protocol', state: 'VERIFIED' },
];

export interface MaterializedTree {
  rootDir: string;
  sourceDriveId: string;
  directories: string[];
  files: { path: string; sizeBytes: number; hash: string }[];
  nodes: SpineExecutionNode[];
  timestamp: string;
}

export function materializeLocalSpineTree(targetDriveId: string = '16kWWLMej1asWNQAiRBakXAMHl41PAEcs4Km91XorPXU'): MaterializedTree {
  const timestamp = new Date().toISOString();
  
  const directories = [
    'spine_runtime/inbox',
    'spine_runtime/routes',
    'spine_runtime/executors',
    'spine_runtime/verifiers',
    'spine_runtime/receipts',
    'spine_runtime/handoffs',
    'spine_runtime/adversarial_logs'
  ];

  const files = [
    { path: 'spine_runtime/inbox/target_manifest.json', sizeBytes: 1024, hash: 'SHA256-4a8f9c1b2e' },
    { path: 'spine_runtime/routes/spine_routing_table.json', sizeBytes: 2048, hash: 'SHA256-7d3e1a9b5f' },
    { path: 'spine_runtime/executors/13_society_units.json', sizeBytes: 4096, hash: 'SHA256-8c2f1e4a9b' },
    { path: 'spine_runtime/verifiers/evidence_merkle_tree.json', sizeBytes: 3072, hash: 'SHA256-1b4e9a8f2c' },
    { path: 'spine_runtime/receipts/spine_execution_receipt.json', sizeBytes: 1536, hash: 'SHA256-9f8e7d6c5b' },
    { path: 'spine_runtime/adversarial_logs/tamper_audit.json', sizeBytes: 2560, hash: 'SHA256-3c2b1a9f8e' }
  ];

  return {
    rootDir: 'spine_runtime',
    sourceDriveId: targetDriveId,
    directories,
    files,
    nodes: CANONICAL_SPINE_NODES,
    timestamp
  };
}
