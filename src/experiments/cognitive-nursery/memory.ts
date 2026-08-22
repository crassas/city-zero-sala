import { ActorState, Domain, MemoryRecord, MemoryStoreType } from './types';

export interface RetrievalQuery {
  queryText?: string;
  queryDomain?: Domain;
  storeType?: MemoryStoreType;
  minConfidence?: number;
  limit?: number;
  weights?: {
    relevance: number;
    salience: number;
    recency: number;
    confidence: number;
    decayPenalty: number;
  };
}

const DEFAULT_WEIGHTS = {
  relevance: 0.35,
  salience: 0.25,
  recency: 0.15,
  confidence: 0.25,
  decayPenalty: 0.2,
};

/**
 * Retrieve memories from actor memory ecology with relevance, salience, recency, confidence, and decay weighting.
 */
export function retrieveMemories(actor: ActorState, query: RetrievalQuery): MemoryRecord[] {
  const w = query.weights || DEFAULT_WEIGHTS;
  const limit = query.limit || 5;
  const minConfidence = query.minConfidence ?? 0.0;
  const now = Date.now();

  const activeMemories = actor.memories.filter(
    (m) => m.evidenceStatus !== 'PRUNED' && m.confidence >= minConfidence
  );

  const scored = activeMemories.map((m) => {
    let relevance = 0.5;
    if (query.queryDomain && m.domain === query.queryDomain) {
      relevance += 0.3;
    }
    if (query.queryText) {
      const lower = query.queryText.toLowerCase();
      if (m.key.toLowerCase().includes(lower) || m.value.toLowerCase().includes(lower)) {
        relevance += 0.4;
      }
    }
    if (query.storeType && m.type === query.storeType) {
      relevance += 0.2;
    }
    relevance = Math.min(1.0, relevance);

    // Recency (half-life decay over 1 hour in simulated/real time)
    const ageSeconds = Math.max(0, (now - m.lastUsed) / 1000);
    const recency = Math.exp(-ageSeconds / 3600);

    const score =
      relevance * w.relevance +
      m.salience * w.salience +
      recency * w.recency +
      m.confidence * w.confidence -
      m.decayState * w.decayPenalty;

    return { memory: m, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, limit).map((s) => {
    // Record usage
    s.memory.useCount += 1;
    s.memory.lastUsed = now;
    return s.memory;
  });

  return selected;
}

/**
 * Inserts or reinforces a memory record.
 */
export function storeOrReinforceMemory(
  actor: ActorState,
  record: Omit<MemoryRecord, 'id' | 'useCount' | 'lastUsed' | 'reinforcements' | 'contradictionCount' | 'decayState'>
): MemoryRecord {
  // Check if identical key exists
  const existing = actor.memories.find((m) => m.key === record.key && m.type === record.type);

  if (existing) {
    existing.reinforcements += 1;
    existing.lastUsed = Date.now();
    existing.confidence = Math.min(1.0, existing.confidence + 0.1);
    existing.salience = Math.max(existing.salience, record.salience);
    existing.decayState = Math.max(0, existing.decayState - 0.2);
    existing.provenance += ` -> REINFORCED[ts=${Date.now()}]`;
    return existing;
  }

  const newRecord: MemoryRecord = {
    ...record,
    id: `MEM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    useCount: 1,
    lastUsed: Date.now(),
    reinforcements: 1,
    contradictionCount: 0,
    decayState: 0.0,
  };

  actor.memories.push(newRecord);
  return newRecord;
}
