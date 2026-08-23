import React, { useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { societyMachine } from '../runtime/societyMachine';
import { EventBus } from '../game/EventBus';
import { RuntimeEvent } from '../runtime/schemas';
import { Terminal, Shield, Play, CheckCircle2, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

export const EvidenceLedger: React.FC = () => {
  const [state, send] = useMachine(societyMachine);
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RuntimeEvent | null>(null);

  useEffect(() => {
    send({ type: 'BOOT' });

    const handleRuntimeEvent = (ev: RuntimeEvent) => {
      setEvents(prev => [ev, ...prev]);
    };

    EventBus.on('runtime-event', handleRuntimeEvent);
    return () => {
      EventBus.off('runtime-event', handleRuntimeEvent);
    };
  }, [send]);

  const handleRunVerticalSlice = () => {
    send({ type: 'DISCOVER_WORK', workUnitId: 'WU-01' });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono text-xs border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-zinc-200">XSTATE SOCIETY RUNTIME LEDGER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
            {state.value.toString()}
          </span>
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
        <div>
          <div className="text-[11px] text-zinc-400">AUTONOMY_MODE: <span className="text-emerald-400 font-bold">APP_OPEN_AUTONOMY</span></div>
          <div className="text-[10px] text-zinc-500">Evidence-only enforcement active</div>
        </div>
        <button
          onClick={handleRunVerticalSlice}
          disabled={!state.matches('IDLE')}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded font-bold transition-colors shadow"
        >
          {state.matches('IDLE') ? <Play className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          Run Slice (WU-01)
        </button>
      </div>

      {state.context.error && (
        <div className="p-3 bg-red-950/50 border-b border-red-900 text-red-300 flex items-center gap-2 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{state.context.error}</span>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Live Emitted Event Stream</div>
        {events.length === 0 ? (
          <div className="text-zinc-600 text-center py-8">Awaiting runtime events... Run the autonomous slice above.</div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.event_id}
              onClick={() => setSelectedEvent(ev)}
              className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                <span className="text-emerald-400 font-bold">{ev.event_type}</span>
                <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-zinc-200 text-[11px] truncate">{ev.message}</div>
              <div className="mt-1 flex items-center gap-2 text-[9px] text-zinc-500">
                <span>Actor: {ev.actor_id}</span>
                <span>•</span>
                <span>WU: {ev.work_unit_id}</span>
                <span>•</span>
                <span className="truncate">Nonce: {ev.run_nonce}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEvent && (
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400">EVENT INSPECTOR</span>
            <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-zinc-200 text-[10px]">CLOSE</button>
          </div>
          <div className="space-y-1 text-[10px] text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800 overflow-x-auto">
            <div><span className="text-zinc-500">EVENT_ID:</span> {selectedEvent.event_id}</div>
            <div><span className="text-zinc-500">ENTRY_ID:</span> {selectedEvent.entry_id}</div>
            <div><span className="text-zinc-500">ACTOR_ID:</span> {selectedEvent.actor_id}</div>
            <div><span className="text-zinc-500">WORK_UNIT_ID:</span> {selectedEvent.work_unit_id}</div>
            <div><span className="text-zinc-500">RUN_NONCE:</span> {selectedEvent.run_nonce}</div>
            <div><span className="text-zinc-500">RECEIPT_ID:</span> {selectedEvent.receipt_id || 'N/A'}</div>
            <div><span className="text-zinc-500">AUTHORITY:</span> {selectedEvent.authority_scope}</div>
          </div>
        </div>
      )}
    </div>
  );
};
