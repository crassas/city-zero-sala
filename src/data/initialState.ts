import { Mission, CanonicalEntrypoint } from '../types';

export const CANONICAL_DRIVE_FILE_ID = "15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w";
export const CANONICAL_FILE_NAME = "operations_console.v0";

export const INITIAL_ENTRYPOINT: CanonicalEntrypoint = {
  fileId: CANONICAL_DRIVE_FILE_ID,
  docUrl: `https://docs.google.com/document/d/${CANONICAL_DRIVE_FILE_ID}/edit`,
  loaded: false,
  lastSyncAttempt: "2026-08-19T09:02:00Z"
};

export const INITIAL_MISSION: Mission = {
  id: "MSN-OPERATIONS-CONSOLE-V0",
  title: "operations_console.v0 Real State Ingestion",
  requiredCapability: "operations_console.v0 Engine",
  assignedWorker: "Pending Direct Payload from operations_console.v0",
  status: "CANONICAL_ENTRYPOINT_PENDING",
  evidence: `Awaiting real payload ingestion from Drive File: operations_console.v0 (ID: ${CANONICAL_DRIVE_FILE_ID})`,
  nextRoute: "UNASSIGNED_UNTIL_REAL_PAYLOAD_LOADED",
  sourceArtefact: `Google Drive File ID: ${CANONICAL_DRIVE_FILE_ID} (${CANONICAL_FILE_NAME})`,
  updatedAt: "2026-08-19T09:02:00Z"
};

export const INITIAL_PIPELINE_STEPS = [
  { id: 'inbox', label: 'MISSION INBOX', description: 'Derived from operations_console.v0' },
  { id: 'worker', label: 'ROUTE TO WORKER', description: 'Assigned worker from real source' },
  { id: 'result', label: 'WORK RESULT', description: 'Execution and artifact generation' },
  { id: 'verify', label: 'VERIFY', description: 'Real payload audit check' },
  { id: 'receipt', label: 'RECEIPT', description: 'Immutable transaction proof' },
  { id: 'handoff', label: 'HANDOFF / NEXT WORKER', description: 'Route to next downstream unit' }
];
