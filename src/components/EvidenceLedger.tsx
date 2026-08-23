import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, Terminal } from 'lucide-react';
import {
  RuntimeEvidenceRecord,
  RuntimeEvidenceStore
} from '../runtime/runtimeEvidenceStore';
import {
  ReadOnlyCapabilityProbeResult,
  runReadOnlyCapabilityProbe
} from '../runtime/readOnlyCapabilityProbe';

const CANONICAL_DRIVE_ID = '15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w';

type ProbeState =
  | { status: 'CHECKING'; result: null }
  | { status: 'READY'; result: ReadOnlyCapabilityProbeResult };

export const EvidenceLedger: React.FC = () => {
  const [events, setEvents] = useState<RuntimeEvidenceRecord[]>(() => RuntimeEvidenceStore.getSnapshot());
  const [selectedEvent, setSelectedEvent] = useState<RuntimeEvidenceRecord | null>(null);
  const [probeState, setProbeState] = useState<ProbeState>({ status: 'CHECKING', result: null });

  useEffect(() => RuntimeEvidenceStore.subscribe(setEvents), []);

  const refreshReadOnlyProbe = useCallback(async () => {
    setProbeState({ status: 'CHECKING', result: null });
    const result = await runReadOnlyCapabilityProbe(CANONICAL_DRIVE_ID);
    setProbeState({ status: 'READY', result });
  }, []);

  useEffect(() => {
    void refreshReadOnlyProbe();
  }, [refreshReadOnlyProbe]);

  const probeVerified =
    probeState.status === 'READY' &&
    probeState.result.DRIVE_AUTH === 'VERIFIED' &&
    probeState.result.DRIVE_READ === 'VERIFIED';

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono text-xs border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-zinc-200 truncate">XSTATE SOCIETY RUNTIME LEDGER</span>
        </div>
        <div className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 whitespace-nowrap">
          READ ONLY
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-zinc-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              OBSERVER MODE
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Persistent browser evidence. Opening this view never writes to Drive.
            </div>
          </div>
          <button
            onClick={() => void refreshReadOnlyProbe()}
            disabled={probeState.status === 'CHECKING'}
            className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 px-3 py-2 rounded font-bold transition-colors border border-zinc-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${probeState.status === 'CHECKING' ? 'animate-spin' : ''}`} />
            Read-only probe
          </button>
        </div>

        {probeState.status === 'CHECKING' ? (
          <div className="text-[10px] text-zinc-500">Checking OAuth + canonical Drive read only…</div>
        ) : probeVerified ? (
          <div className="flex items-center gap-2 text-[10px] text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            DRIVE_AUTH VERIFIED · DRIVE_READ VERIFIED · ZERO WRITE PROBE
          </div>
        ) : (
          <div className="flex items-start gap-2 text-[10px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{probeState.result.error || 'Read-only capability check blocked.'}</span>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Persistent Runtime Event Stream
          </div>
          <div className="text-[10px] text-zinc-600">{events.length} stored</div>
        </div>

        {events.length === 0 ? (
          <div className="text-zinc-600 text-center py-8 leading-5">
            No runtime evidence captured yet.<br />
            Run the verified Micro Worker from the Console, then return here.
          </div>
        ) : (
          events.map(event => (
            <button
              type="button"
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="w-full text-left p-2.5 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 gap-2">
                <span className="text-emerald-400 font-bold truncate">{event.eventType}</span>
                <span className="whitespace-nowrap">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-zinc-200 text-[11px] break-words">{event.message}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-zinc-500">
                {event.actorId && <span>Actor: {event.actorId}</span>}
                {event.workUnitId && <span>WU: {event.workUnitId}</span>}
                {event.runNonce && <span>Nonce: {event.runNonce}</span>}
                <span>Source: {event.source}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedEvent && (
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400">EVENT INSPECTOR</span>
            <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-zinc-200 text-[10px]">
              CLOSE
            </button>
          </div>
          <div className="space-y-1 text-[10px] text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800 overflow-x-auto">
            <div><span className="text-zinc-500">EVENT_ID:</span> {selectedEvent.id}</div>
            <div><span className="text-zinc-500">EVENT_TYPE:</span> {selectedEvent.eventType}</div>
            <div><span className="text-zinc-500">ENTRY_ID:</span> {selectedEvent.entryId || 'N/A'}</div>
            <div><span className="text-zinc-500">ACTOR_ID:</span> {selectedEvent.actorId || 'N/A'}</div>
            <div><span className="text-zinc-500">WORK_UNIT_ID:</span> {selectedEvent.workUnitId || 'N/A'}</div>
            <div><span className="text-zinc-500">RUN_NONCE:</span> {selectedEvent.runNonce || 'N/A'}</div>
            <div><span className="text-zinc-500">RECEIPT_ID:</span> {selectedEvent.receiptId || 'N/A'}</div>
            <div><span className="text-zinc-500">AUTHORITY:</span> {selectedEvent.authorityScope || 'N/A'}</div>
            <div><span className="text-zinc-500">SOURCE:</span> {selectedEvent.source}</div>
          </div>
        </div>
      )}
    </div>
  );
};
