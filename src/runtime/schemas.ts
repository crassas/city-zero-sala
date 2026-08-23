import { z } from 'zod';

export const WorkUnitStatusSchema = z.enum(['ACTIVE', 'STALE', 'BLOCKED', 'COMPLETED']);
export const MissionStatusSchema = z.enum([
  'CANONICAL_ENTRYPOINT_PENDING',
  'PENDING',
  'INBOX',
  'ROUTED_TO_WORKER',
  'WORK_IN_PROGRESS',
  'IN_PROGRESS',
  'VERIFYING',
  'RECEIPT_PENDING',
  'HANDOFF_READY',
  'COMPLETED',
  'FAILED'
]);

export const VerificationInfoSchema = z.object({
  verifiedBy: z.string(),
  verifiedAt: z.string(),
  status: z.enum(['VERIFIED', 'UNVERIFIED', 'FAILED'])
});

export const WorkUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  capability: z.string(),
  assignedAgent: z.string(),
  status: WorkUnitStatusSchema,
  staleState: z.boolean(),
  staleReason: z.string().optional(),
  ownerGate: z.boolean(),
  gateRequirement: z.string().optional(),
  evidence: z.string(),
  verification: VerificationInfoSchema,
  nextRoute: z.string()
});

export const OwnerGateItemSchema = z.object({
  gateId: z.string(),
  description: z.string(),
  status: z.enum(['OPEN', 'LOCKED']),
  requiredRole: z.string()
});

export const OperationsConsolePayloadSchema = z.object({
  version: z.literal('operations_console.v0'),
  sourceDriveId: z.string(),
  sourceName: z.string(),
  adapterBoundary: z.enum(['LOCAL_BOOTSTRAP_ADAPTER', 'DRIVE_LIVE_SYNC']),
  isReadOnly: z.literal(true),
  lastBootstrapAt: z.string(),
  agents: z.array(z.string()),
  workUnits: z.array(WorkUnitSchema),
  ownerGates: z.array(OwnerGateItemSchema),
  staleStateSummary: z.object({
    totalUnits: z.number(),
    staleCount: z.number(),
    activeCount: z.number(),
    blockedCount: z.number()
  })
});

export const AdmissionTicketSchema = z.object({
  ENTRY_ID: z.string(),
  ACTOR_ID: z.string(),
  MODEL_OR_PROVIDER: z.string(),
  MISSION_ID: z.string(),
  WORK_UNIT_ID: z.string(),
  CLAIMED_AT: z.number(),
  SCOPE: z.string(),
  RETURN_POINT: z.string(),
  ATTEMPT_EPOCH: z.number(),
  AUTHORITY_SCOPE: z.string(),
  RUN_NONCE: z.string()
});

export const RuntimeEventSchema = z.object({
  event_id: z.string(),
  entry_id: z.string(),
  actor_id: z.string(),
  mission_id: z.string(),
  work_unit_id: z.string(),
  attempt_epoch: z.number(),
  run_nonce: z.string(),
  event_type: z.enum([
    'ADMITTED',
    'CLAIMED',
    'ROUTED',
    'ARRIVED',
    'WORKING',
    'RECEIPT_CREATED',
    'READBACK_VERIFIED',
    'RETURN_PLANNED',
    'STOP_DECLARED',
    'RETURN_RESUMED',
    'ARRIVAL_HOME_VERIFIED',
    'HANDOFF_DELIVERED',
    'SHIFT_CLOSED',
    'COMPLETED_VERIFIED',
    'BLOCKED',
    'FAILED'
  ]),
  from_state: z.string(),
  to_state: z.string(),
  timestamp: z.string(),
  source: z.string(),
  target: z.string(),
  authority_scope: z.string(),
  evidence_refs: z.array(z.string()),
  message: z.string(),
  receipt_id: z.string().optional()
});

export type OperationsConsolePayload = z.infer<typeof OperationsConsolePayloadSchema>;
export type WorkUnit = z.infer<typeof WorkUnitSchema>;
export type AdmissionTicket = z.infer<typeof AdmissionTicketSchema>;
export type RuntimeEvent = z.infer<typeof RuntimeEventSchema>;
export { RouteLedgerEntrySchema, OperationalStopSchema, RoutePhaseSchema } from '../../routeLedger';
export type { RouteLedgerEntry, OperationalStop } from '../../routeLedger';
