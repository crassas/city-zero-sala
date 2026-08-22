import { fetchDriveFile, createAndVerifyDriveFile } from '../lib/driveService';
import { AdmissionTicket, RuntimeEvent, WorkUnit } from '../types';
import { EventBus } from '../game/EventBus';

export class AgenticRuntime {
  private activeTickets: Map<string, AdmissionTicket> = new Map();
  private epoch = 1;

  // PHASE 1 - CITY GATE
  public async requestAdmission(actorId: string, missionId: string, workUnitId: string, driveSourceId: string): Promise<AdmissionTicket> {
    if (!driveSourceId) throw new Error('NO_MISSION_SOURCE_ID');
    
    // Simulate Gate Probe Requirement (we assume capability probe passed if we reach here)
    const runNonce = `RN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const ticket: AdmissionTicket = {
      ENTRY_ID: `ENT-${Date.now()}`,
      ACTOR_ID: actorId,
      MODEL_OR_PROVIDER: 'Operations_Console_Worker',
      MISSION_ID: missionId,
      WORK_UNIT_ID: workUnitId,
      CLAIMED_AT: Date.now(),
      SCOPE: 'READ_WRITE_VERIFIED',
      RETURN_POINT: 'CITY_GATE',
      ATTEMPT_EPOCH: this.epoch++,
      AUTHORITY_SCOPE: driveSourceId,
      RUN_NONCE: runNonce,
    };

    this.activeTickets.set(ticket.ENTRY_ID, ticket);
    
    EventBus.emit('runtime-event', {
      type: 'ADMITTED',
      ticket,
      message: `Worker ${actorId} admitted for WU ${workUnitId} [Nonce: ${runNonce}]`
    } as RuntimeEvent);

    return ticket;
  }

  // PHASE 4 - FIRST REAL MICRO WORKER
  public async executeMicroWorkerLoop(ticket: AdmissionTicket, targetWorkUnit: WorkUnit) {
    try {
      EventBus.emit('runtime-event', {
        type: 'CLAIMED',
        ticket,
        message: `Worker ${ticket.ACTOR_ID} claimed ${targetWorkUnit.id}`
      } as RuntimeEvent);

      // Phase 3 & 4: Read canonical source
      EventBus.emit('runtime-event', {
        type: 'WORKING',
        ticket,
        message: `Reading Drive Source: ${ticket.AUTHORITY_SCOPE}`
      } as RuntimeEvent);

      const readResult = await fetchDriveFile(ticket.AUTHORITY_SCOPE);
      if (!readResult.success || !readResult.content) {
        throw new Error(`SOURCE_UNREACHABLE: ${readResult.error}`);
      }

      // Bound action: extract length
      const docLength = readResult.content.length;
      const extractedEvidence = `Extracted data length ${docLength} bytes from source ${ticket.AUTHORITY_SCOPE}. Run Nonce: ${ticket.RUN_NONCE}`;

      // Create Receipt
      const receiptContent = JSON.stringify({
        entry_id: ticket.ENTRY_ID,
        actor_id: ticket.ACTOR_ID,
        work_unit_id: ticket.WORK_UNIT_ID,
        nonce: ticket.RUN_NONCE,
        evidence: extractedEvidence,
        status: 'COMPLETED_VERIFIED',
        timestamp: new Date().toISOString()
      }, null, 2);

      EventBus.emit('runtime-event', {
        type: 'RECEIPT_CREATED',
        ticket,
        message: `Writing receipt to Drive with nonce ${ticket.RUN_NONCE}`
      } as RuntimeEvent);

      const receiptFile = await createAndVerifyDriveFile(
        `RECEIPT_${ticket.WORK_UNIT_ID}_${ticket.ENTRY_ID}.json`,
        receiptContent,
        `Execution Receipt for ${ticket.WORK_UNIT_ID}`
      );

      if (receiptFile.status === 'DRIVE_WRITE_BLOCKED' || !receiptFile.verifiedContent) {
        throw new Error(`RECEIPT_FAILED: ${receiptFile.error}`);
      }

      // Final Readback Validation check (nonce check)
      if (!receiptFile.verifiedContent.includes(ticket.RUN_NONCE)) {
        throw new Error('NONCE_MISMATCH: Written file does not contain expected nonce');
      }

      EventBus.emit('runtime-event', {
        type: 'READBACK_VERIFIED',
        ticket,
        receiptId: receiptFile.fileId,
        evidence: extractedEvidence,
        message: `Readback verified on Drive ID ${receiptFile.fileId}. Nonce matched.`
      } as RuntimeEvent);

      EventBus.emit('runtime-event', {
        type: 'COMPLETED',
        ticket,
        message: `Work Unit ${ticket.WORK_UNIT_ID} successfully executed and verified.`
      } as RuntimeEvent);

      this.activeTickets.delete(ticket.ENTRY_ID);
      
    } catch (e: any) {
      EventBus.emit('runtime-event', {
        type: 'BLOCKED',
        ticket,
        message: `BLOCKED | reason=${e.message}`
      } as RuntimeEvent);
    }
  }
}

export const AgentRuntimeInstance = new AgenticRuntime();
