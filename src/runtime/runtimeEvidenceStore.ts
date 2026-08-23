import { EventBus } from '../game/EventBus';

const STORAGE_KEY = 'city_zero_runtime_evidence_v1';
const MAX_RECORDS = 200;

export interface RuntimeEvidenceRecord {
  id: string;
  eventType: string;
  timestamp: string;
  entryId?: string;
  actorId?: string;
  missionId?: string;
  workUnitId?: string;
  runNonce?: string;
  receiptId?: string;
  authorityScope?: string;
  message: string;
  evidenceRefs: string[];
  source: 'agentic-runtime' | 'society-runtime';
}

type EvidenceListener = (records: RuntimeEvidenceRecord[]) => void;

function newEventId(): string {
  try {
    return `EV-${crypto.randomUUID()}`;
  } catch {
    return `EV-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function loadRecords(): RuntimeEvidenceRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECORDS) as RuntimeEvidenceRecord[];
  } catch {
    return [];
  }
}

function persistRecords(records: RuntimeEvidenceRecord[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch (error) {
    console.warn('Unable to persist runtime evidence locally:', error);
  }
}

function normalizeRuntimeEvent(raw: unknown): RuntimeEvidenceRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const event = raw as Record<string, any>;

  // XState Society runtime event shape.
  if (event.event_id || event.event_type) {
    return {
      id: String(event.event_id || newEventId()),
      eventType: String(event.event_type || 'UNKNOWN'),
      timestamp: String(event.timestamp || new Date().toISOString()),
      entryId: event.entry_id ? String(event.entry_id) : undefined,
      actorId: event.actor_id ? String(event.actor_id) : undefined,
      missionId: event.mission_id ? String(event.mission_id) : undefined,
      workUnitId: event.work_unit_id ? String(event.work_unit_id) : undefined,
      runNonce: event.run_nonce ? String(event.run_nonce) : undefined,
      receiptId: event.receipt_id ? String(event.receipt_id) : undefined,
      authorityScope: event.authority_scope ? String(event.authority_scope) : undefined,
      message: String(event.message || event.event_type || 'Runtime event'),
      evidenceRefs: Array.isArray(event.evidence_refs)
        ? event.evidence_refs.map((value: unknown) => String(value))
        : [],
      source: 'society-runtime'
    };
  }

  // AgenticRuntime event shape.
  if (event.type && event.ticket && typeof event.ticket === 'object') {
    const ticket = event.ticket as Record<string, any>;
    return {
      id: newEventId(),
      eventType: String(event.type),
      timestamp: new Date().toISOString(),
      entryId: ticket.ENTRY_ID ? String(ticket.ENTRY_ID) : undefined,
      actorId: ticket.ACTOR_ID ? String(ticket.ACTOR_ID) : undefined,
      missionId: ticket.MISSION_ID ? String(ticket.MISSION_ID) : undefined,
      workUnitId: ticket.WORK_UNIT_ID ? String(ticket.WORK_UNIT_ID) : undefined,
      runNonce: ticket.RUN_NONCE ? String(ticket.RUN_NONCE) : undefined,
      receiptId: event.receiptId ? String(event.receiptId) : undefined,
      authorityScope: ticket.AUTHORITY_SCOPE ? String(ticket.AUTHORITY_SCOPE) : undefined,
      message: String(event.message || event.type),
      evidenceRefs: event.evidence ? [String(event.evidence)] : [],
      source: 'agentic-runtime'
    };
  }

  return null;
}

class RuntimeEvidenceStoreImpl {
  private records: RuntimeEvidenceRecord[] = loadRecords();
  private listeners = new Set<EvidenceListener>();

  constructor() {
    EventBus.on('runtime-event', this.handleRuntimeEvent);
  }

  private handleRuntimeEvent = (raw: unknown) => {
    const record = normalizeRuntimeEvent(raw);
    if (!record) return;

    this.records = [record, ...this.records.filter(existing => existing.id !== record.id)].slice(0, MAX_RECORDS);
    persistRecords(this.records);
    this.notify();
  };

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }

  getSnapshot = (): RuntimeEvidenceRecord[] => [...this.records];

  subscribe = (listener: EvidenceListener): (() => void) => {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  };
}

// EvidenceLedger is statically imported by App, so this singleton starts
// listening as soon as the application bundle is evaluated, before a user
// opens the ledger view.
export const RuntimeEvidenceStore = new RuntimeEvidenceStoreImpl();
