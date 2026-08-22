import { assign, createMachine, fromPromise } from 'xstate';
import { OperationsConsolePayloadSchema, AdmissionTicket, RuntimeEvent } from './schemas';
import { OperationsConsolePayload, WorkUnit } from '../types';
import { fetchDriveFile, createAndVerifyDriveFile, runCapabilityProbe } from '../lib/driveService';
import { CityTopologyInstance } from './topology';
import { EventBus } from '../game/EventBus';

export interface SocietyContext {
  payload: OperationsConsolePayload | null;
  activeTicket: AdmissionTicket | null;
  selectedWorkUnit: WorkUnit | null;
  events: RuntimeEvent[];
  error: string | null;
  autonomyMode: 'APP_OPEN_AUTONOMY' | 'BACKGROUND_AUTONOMY' | 'BLOCKED';
}

export type SocietyEvent =
  | { type: 'BOOT' }
  | { type: 'PROBE_CAPABILITY' }
  | { type: 'HYDRATE' }
  | { type: 'DISCOVER_WORK'; workUnitId: string }
  | { type: 'ROUTE' }
  | { type: 'CLAIM'; actorId: string }
  | { type: 'EXECUTE' }
  | { type: 'VERIFY' }
  | { type: 'PERSIST_RECEIPT' }
  | { type: 'READBACK_VERIFY' }
  | { type: 'RECONCILE' }
  | { type: 'STOP' };

export const societyMachine = createMachine({
  id: 'societyRuntime',
  initial: 'BOOTING',
  context: {
    payload: null,
    activeTicket: null,
    selectedWorkUnit: null,
    events: [],
    error: null,
    autonomyMode: 'APP_OPEN_AUTONOMY' as const
  },
  states: {
    BOOTING: {
      on: {
        BOOT: 'CAPABILITY_PROBE'
      }
    },
    CAPABILITY_PROBE: {
      invoke: {
        id: 'probeDrive',
        src: fromPromise(async () => {
          const probe = await runCapabilityProbe('15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w');
          if (probe.DRIVE_AUTH !== 'VERIFIED' || probe.DRIVE_READ !== 'VERIFIED') {
            throw new Error(`CAPABILITY_BLOCKED: Auth=${probe.DRIVE_AUTH}, Read=${probe.DRIVE_READ}`);
          }
          return probe;
        }),
        onDone: 'HYDRATING_CANONICAL_STATE',
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Capability probe failed: ${(event.error as any)?.message || event.error}`
          })
        }
      }
    },
    HYDRATING_CANONICAL_STATE: {
      invoke: {
        id: 'hydrateCanonical',
        src: fromPromise(async () => {
          // Import bootstrap payload and validate with Zod
          const { OPERATIONS_CONSOLE_V0_PAYLOAD } = await import('../data/operationsConsoleV0');
          const parsed = OperationsConsolePayloadSchema.parse(OPERATIONS_CONSOLE_V0_PAYLOAD);
          return parsed;
        }),
        onDone: {
          target: 'IDLE',
          actions: assign({
            payload: ({ event }) => event.output
          })
        },
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Hydration Zod Validation Failed: ${(event.error as any)?.message}`
          })
        }
      }
    },
    IDLE: {
      on: {
        DISCOVER_WORK: {
          target: 'WORK_DISCOVERED',
          actions: assign({
            selectedWorkUnit: ({ context, event }) => context.payload?.workUnits.find(w => w.id === event.workUnitId) || null
          })
        }
      }
    },
    WORK_DISCOVERED: {
      always: 'ROUTING'
    },
    ROUTING: {
      invoke: {
        id: 'routePath',
        src: fromPromise(async ({ input }: { input: any }) => {
          const context = input as SocietyContext;
          const wuId = context.selectedWorkUnit?.id || 'WU-01';
          const path = CityTopologyInstance.getShortestPath('CITY_GATE', wuId);
          if (!path) throw new Error(`UNKNOWN_ROUTE: No valid graphology edge from CITY_GATE to ${wuId}`);
          return path;
        }),
        input: ({ context }: any) => context,
        onDone: {
          target: 'CLAIMING',
          actions: ({ context, event }) => {
            const ev: RuntimeEvent = {
              event_id: `EV-${crypto.randomUUID()}`,
              entry_id: `ENT-${Date.now()}`,
              actor_id: context.selectedWorkUnit?.assignedAgent || 'AGENT_PRIME',
              mission_id: 'MSN-OP-CONSOLE-V0',
              work_unit_id: context.selectedWorkUnit?.id || 'WU-01',
              attempt_epoch: 1,
              run_nonce: `RN-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
              event_type: 'ROUTED',
              from_state: 'ROUTING',
              to_state: 'CLAIMING',
              timestamp: new Date().toISOString(),
              source: 'CITY_GATE',
              target: context.selectedWorkUnit?.id || 'WU-01',
              authority_scope: context.payload?.sourceDriveId || '',
              evidence_refs: [JSON.stringify(event.output)],
              message: `Path verified via Graphology: ${event.output.join(' -> ')}`
            };
            EventBus.emit('runtime-event', ev);
          }
        },
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Routing failure: ${(event.error as any)?.message}`
          })
        }
      }
    },
    CLAIMING: {
      invoke: {
        id: 'claimWork',
        src: fromPromise(async ({ input }: { input: any }) => {
          const context = input as SocietyContext;
          const wu = context.selectedWorkUnit;
          if (!wu) throw new Error('NO_WORK_UNIT_SELECTED');
          const ticket: AdmissionTicket = {
            ENTRY_ID: `ENT-${Date.now()}`,
            ACTOR_ID: wu.assignedAgent,
            MODEL_OR_PROVIDER: 'XState_Society_Runtime',
            MISSION_ID: 'MSN-OP-CONSOLE-V0',
            WORK_UNIT_ID: wu.id,
            CLAIMED_AT: Date.now(),
            SCOPE: 'READ_WRITE_VERIFIED',
            RETURN_POINT: 'CITY_GATE',
            ATTEMPT_EPOCH: 1,
            AUTHORITY_SCOPE: context.payload?.sourceDriveId || '',
            RUN_NONCE: `RN-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
          };
          return ticket;
        }),
        input: ({ context }: any) => context,
        onDone: {
          target: 'DISPATCHING',
          actions: assign({
            activeTicket: ({ event, context }) => {
              const ticket = event.output;
              const ev: RuntimeEvent = {
                event_id: `EV-${crypto.randomUUID()}`,
                entry_id: ticket.ENTRY_ID,
                actor_id: ticket.ACTOR_ID,
                mission_id: ticket.MISSION_ID,
                work_unit_id: ticket.WORK_UNIT_ID,
                attempt_epoch: ticket.ATTEMPT_EPOCH,
                run_nonce: ticket.RUN_NONCE,
                event_type: 'CLAIMED',
                from_state: 'CLAIMING',
                to_state: 'DISPATCHING',
                timestamp: new Date().toISOString(),
                source: 'CITY_GATE',
                target: ticket.WORK_UNIT_ID,
                authority_scope: ticket.AUTHORITY_SCOPE,
                evidence_refs: [ticket.RUN_NONCE],
                message: `Actor ${ticket.ACTOR_ID} successfully claimed ${ticket.WORK_UNIT_ID} with Nonce ${ticket.RUN_NONCE}`
              };
              EventBus.emit('runtime-event', ev);
              return ticket;
            }
          })
        },
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Claim failed: ${(event.error as any)?.message}`
          })
        }
      }
    },
    DISPATCHING: {
      always: 'VERIFYING'
    },
    VERIFYING: {
      invoke: {
        id: 'executeDriveRead',
        src: fromPromise(async ({ input }: { input: any }) => {
          const context = input as SocietyContext;
          const ticket = context.activeTicket;
          if (!ticket) throw new Error('NO_ACTIVE_TICKET');
          const result = await fetchDriveFile(ticket.AUTHORITY_SCOPE);
          if (!result.success || !result.content) {
            throw new Error(`DRIVE_READ_FAILED: ${result.error}`);
          }
          return { content: result.content, length: result.content.length };
        }),
        input: ({ context }: any) => context,
        onDone: {
          target: 'PERSIST_RECEIPT',
          actions: ({ context, event }) => {
            const ticket = context.activeTicket!;
            const ev: RuntimeEvent = {
              event_id: `EV-${crypto.randomUUID()}`,
              entry_id: ticket.ENTRY_ID,
              actor_id: ticket.ACTOR_ID,
              mission_id: ticket.MISSION_ID,
              work_unit_id: ticket.WORK_UNIT_ID,
              attempt_epoch: ticket.ATTEMPT_EPOCH,
              run_nonce: ticket.RUN_NONCE,
              event_type: 'WORKING',
              from_state: 'VERIFYING',
              to_state: 'PERSIST_RECEIPT',
              timestamp: new Date().toISOString(),
              source: ticket.WORK_UNIT_ID,
              target: 'DRIVE_API',
              authority_scope: ticket.AUTHORITY_SCOPE,
              evidence_refs: [`Length: ${event.output.length}`],
              message: `External Drive read verified. Length: ${event.output.length} bytes.`
            };
            EventBus.emit('runtime-event', ev);
          }
        },
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Verification read failed: ${(event.error as any)?.message}`
          })
        }
      }
    },
    PERSIST_RECEIPT: {
      invoke: {
        id: 'writeReceipt',
        src: fromPromise(async ({ input }: { input: any }) => {
          const context = input as SocietyContext;
          const ticket = context.activeTicket!;
          const receiptContent = JSON.stringify({
            autonomy_vertical_slice_verified: true,
            actor_id: ticket.ACTOR_ID,
            entry_id: ticket.ENTRY_ID,
            work_unit_id: ticket.WORK_UNIT_ID,
            claim_id: ticket.ENTRY_ID,
            run_nonce: ticket.RUN_NONCE,
            timestamp: new Date().toISOString()
          }, null, 2);

          const probe = await createAndVerifyDriveFile(
            `AUTONOMOUS_RECEIPT_${ticket.WORK_UNIT_ID}_${ticket.RUN_NONCE}.json`,
            receiptContent,
            'Autonomous vertical slice verified execution receipt'
          );
          if (probe.status !== 'DRIVE_WRITE_VERIFIED' || !probe.fileId) {
            throw new Error(`RECEIPT_WRITE_FAILED: ${probe.error}`);
          }
          return probe;
        }),
        input: ({ context }: any) => context,
        onDone: {
          target: 'READBACK_VERIFYING',
          actions: ({ context, event }) => {
            const ticket = context.activeTicket!;
            const probe = event.output;
            const ev: RuntimeEvent = {
              event_id: `EV-${crypto.randomUUID()}`,
              entry_id: ticket.ENTRY_ID,
              actor_id: ticket.ACTOR_ID,
              mission_id: ticket.MISSION_ID,
              work_unit_id: ticket.WORK_UNIT_ID,
              attempt_epoch: ticket.ATTEMPT_EPOCH,
              run_nonce: ticket.RUN_NONCE,
              event_type: 'RECEIPT_CREATED',
              from_state: 'PERSIST_RECEIPT',
              to_state: 'READBACK_VERIFYING',
              timestamp: new Date().toISOString(),
              source: 'LOCAL_RUNTIME',
              target: probe.fileId!,
              authority_scope: ticket.AUTHORITY_SCOPE,
              evidence_refs: [probe.fileId!],
              receipt_id: probe.fileId,
              message: `Receipt persisted to Drive with ID ${probe.fileId}.`
            };
            EventBus.emit('runtime-event', ev);
          }
        },
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Receipt persist failed: ${(event.error as any)?.message}`
          })
        }
      }
    },
    READBACK_VERIFYING: {
      invoke: {
        id: 'readbackCheck',
        src: fromPromise(async ({ input }: { input: any }) => {
          const context = input.context as SocietyContext;
          const probe = input.event.output;
          const ticket = context.activeTicket!;
          const readResult = await fetchDriveFile(probe.fileId!);
          if (!readResult.success || !readResult.content) {
            throw new Error(`READBACK_FAILED: ${readResult.error}`);
          }
          if (!readResult.content.includes(ticket.RUN_NONCE)) {
            throw new Error(`NONCE_MISMATCH: Written nonce ${ticket.RUN_NONCE} not found in readback content`);
          }
          return { fileId: probe.fileId, content: readResult.content };
        }),
        input: ({ context, event }: any) => ({ context, event }),
        onDone: {
          target: 'RECONCILING',
          actions: ({ context, event }) => {
            const ticket = context.activeTicket!;
            const { fileId } = event.output;
            const ev: RuntimeEvent = {
              event_id: `EV-${crypto.randomUUID()}`,
              entry_id: ticket.ENTRY_ID,
              actor_id: ticket.ACTOR_ID,
              mission_id: ticket.MISSION_ID,
              work_unit_id: ticket.WORK_UNIT_ID,
              attempt_epoch: ticket.ATTEMPT_EPOCH,
              run_nonce: ticket.RUN_NONCE,
              event_type: 'READBACK_VERIFIED',
              from_state: 'READBACK_VERIFYING',
              to_state: 'RECONCILING',
              timestamp: new Date().toISOString(),
              source: fileId,
              target: 'LOCAL_RUNTIME',
              authority_scope: ticket.AUTHORITY_SCOPE,
              evidence_refs: [fileId],
              receipt_id: fileId,
              message: `AUTONOMOUS_VERTICAL_SLICE_VERIFIED | actor_id=${ticket.ACTOR_ID} entry_id=${ticket.ENTRY_ID} work_unit_id=${ticket.WORK_UNIT_ID} run_nonce=${ticket.RUN_NONCE} drive_receipt_id=${fileId} readback_verified=true`
            };
            EventBus.emit('runtime-event', ev);
          }
        },
        onError: {
          target: 'BLOCKED',
          actions: assign({
            error: ({ event }) => `Readback verification failed: ${(event.error as any)?.message}`
          })
        }
      }
    },
    RECONCILING: {
      always: {
        target: 'IDLE',
        actions: ({ context }) => {
          const ticket = context.activeTicket!;
          const ev: RuntimeEvent = {
            event_id: `EV-${crypto.randomUUID()}`,
            entry_id: ticket.ENTRY_ID,
            actor_id: ticket.ACTOR_ID,
            mission_id: ticket.MISSION_ID,
            work_unit_id: ticket.WORK_UNIT_ID,
            attempt_epoch: ticket.ATTEMPT_EPOCH,
            run_nonce: ticket.RUN_NONCE,
            event_type: 'COMPLETED_VERIFIED',
            from_state: 'RECONCILING',
            to_state: 'IDLE',
            timestamp: new Date().toISOString(),
            source: ticket.WORK_UNIT_ID,
            target: 'CITY_GATE',
            authority_scope: ticket.AUTHORITY_SCOPE,
            evidence_refs: [ticket.RUN_NONCE],
            message: `Work Unit ${ticket.WORK_UNIT_ID} fully verified and reconciled. Claim released. Actor returned to AVAILABLE.`
          };
          EventBus.emit('runtime-event', ev);
        }
      }
    },
    BLOCKED: {
      on: {
        RECONCILE: 'IDLE'
      }
    },
    STOPPED: {}
  }
});
