import { ActorState, TransferComparisonResult, ScientificMetrics, HistorySwapBranch } from './types';

const STORAGE_KEY_SESSION = 'CITY_ZERO_COGNITIVE_NURSERY_SESSION_V02';
const STORAGE_PREFIX_ACTOR = 'CITY_ZERO_COGNITIVE_NURSERY_ACTOR_';

export interface NurserySessionState {
  version: '0.2';
  timestamp: number;
  actors: ActorState[];
  selectedActorIndex: number;
  activeTab: 'NURSERY' | 'WORKSPACE' | 'MEMORY' | 'DEVELOPMENT' | 'TRANSFER' | 'SWAP_TRIAL' | 'LINEAGE' | 'EVIDENCE';
  transferResults: TransferComparisonResult[];
  metrics: ScientificMetrics | null;
  historySwapBranch?: HistorySwapBranch | null;
  statusMessage: string;
}

/**
 * Validates whether an object is a structurally intact ActorState.
 */
export function isValidActorState(actor: any): actor is ActorState {
  if (!actor || typeof actor !== 'object') return false;
  if (typeof actor.actor_id !== 'string' || !actor.actor_id) return false;
  if (typeof actor.birth_seed !== 'number') return false;
  if (typeof actor.global_plasticity !== 'number') return false;
  if (!Array.isArray(actor.memories)) return false;
  if (!Array.isArray(actor.experience_ledger)) return false;
  if (!Array.isArray(actor.provenance_log)) return false;
  return true;
}

/**
 * Persists the entire Cognitive Nursery session state to localStorage.
 */
export function saveNurserySessionState(state: NurserySessionState): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY_SESSION, serialized);
      // Also persist individual actor snapshots for direct key lookups
      if (Array.isArray(state.actors)) {
        for (const actor of state.actors) {
          if (isValidActorState(actor)) {
            localStorage.setItem(`${STORAGE_PREFIX_ACTOR}${actor.actor_id}`, JSON.stringify(actor));
          }
        }
      }
      return true;
    }
  } catch (err) {
    console.warn('[CognitiveNursery] LocalStorage session save failed:', err);
  }
  return false;
}

/**
 * Loads and validates the Cognitive Nursery session state from localStorage.
 * Returns null if no valid snapshot is found.
 */
export function loadNurserySessionState(): NurserySessionState | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as NurserySessionState;
      if (
        parsed &&
        parsed.version === '0.2' &&
        Array.isArray(parsed.actors) &&
        parsed.actors.length > 0 &&
        parsed.actors.every(isValidActorState)
      ) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CognitiveNursery] LocalStorage session load failed:', err);
  }
  return null;
}

/**
 * Clears the persisted nursery session state from localStorage.
 */
export function clearNurserySessionState(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (err) {
    console.warn('[CognitiveNursery] LocalStorage session clear failed:', err);
  }
}

/**
 * Persists an individual actor's full state snapshot to localStorage.
 */
export function saveActorToStorage(actor: ActorState): boolean {
  try {
    if (typeof localStorage !== 'undefined' && isValidActorState(actor)) {
      localStorage.setItem(`${STORAGE_PREFIX_ACTOR}${actor.actor_id}`, JSON.stringify(actor));
      return true;
    }
  } catch (err) {
    console.warn('[CognitiveNursery] LocalStorage actor save failed:', err);
  }
  return false;
}

/**
 * Loads an individual actor snapshot from localStorage.
 */
export function loadActorFromStorage(actorId: string): ActorState | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`${STORAGE_PREFIX_ACTOR}${actorId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidActorState(parsed)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[CognitiveNursery] LocalStorage actor load failed:', err);
  }
  return null;
}

/**
 * Exports an actor state to a serialized JSON string for inter-session lineage transmission.
 */
export function exportActorToJson(actor: ActorState): string {
  return JSON.stringify(actor, null, 2);
}

/**
 * Imports and rehydrates an actor state from a JSON string.
 */
export function importActorFromJson(jsonStr: string): ActorState {
  const parsed = JSON.parse(jsonStr);
  if (!isValidActorState(parsed)) {
    throw new Error('INVALID_ACTOR_SNAPSHOT: missing required structural fields');
  }
  return parsed;
}

/**
 * Validates that a rehydrated actor is structurally and byte equivalent to original snapshot.
 */
export function assertRehydrationEquivalence(original: ActorState, rehydrated: ActorState): boolean {
  return JSON.stringify(original) === JSON.stringify(rehydrated);
}
