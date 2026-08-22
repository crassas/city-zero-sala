import React, { useState } from 'react';
import { ActorState, MemoryRecord, MemoryStoreType } from '../types';
import { Database, Filter, Clock, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

interface MemoryInspectorProps {
  actor: ActorState;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ actor }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredMemories = actor.memories.filter((m) =>
    selectedType === 'ALL' ? true : m.type === selectedType
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <h3 className="font-mono text-xs font-bold text-zinc-200">
            MEMORY ECOLOGY & PROVENANCE AUDIT ({actor.memories.length} Active Records)
          </h3>
        </div>
        <div className="flex gap-1.5 font-mono text-[11px]">
          {['ALL', 'EPISODIC', 'SEMANTIC', 'SOCIAL_TESTIMONY'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedType === t
                  ? 'bg-purple-900/50 text-purple-200 border border-purple-700'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredMemories.length === 0 ? (
          <div className="col-span-2 p-8 text-center font-mono text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
            No memory records found in this category.
          </div>
        ) : (
          filteredMemories.map((m) => (
            <div
              key={m.id}
              className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 font-mono space-y-2 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-purple-300 border border-purple-900/40 font-bold">
                  {m.type}
                </span>
                <span className="text-zinc-500 text-[10px]">{m.domain}</span>
              </div>

              <div className="text-xs text-zinc-200 font-semibold">{m.key}</div>
              <div className="text-[11px] text-zinc-400 bg-zinc-900/80 p-2 rounded border border-zinc-800/60 break-all">
                {m.value}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-zinc-400 border-t border-zinc-800/60">
                <div>
                  Conf: <strong className="text-emerald-400">{(m.confidence * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  Salience: <strong className="text-cyan-400">{(m.salience * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  Decay: <strong className="text-amber-400">{(m.decayState * 100).toFixed(0)}%</strong>
                </div>
              </div>

              <div className="text-[9px] text-zinc-500 truncate pt-1 border-t border-zinc-900">
                PROV: {m.provenance}
              </div>
            </div>
          ))
        )}
      </div>

      {actor.pruned_records.length > 0 && (
        <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
          <div className="font-bold text-zinc-300">Pruned / Archived Memory Records ({actor.pruned_records.length})</div>
          <div className="text-[10px] text-zinc-500">
            Historical representations retired due to excessive decay while preserving immutable provenance trails.
          </div>
        </div>
      )}
    </div>
  );
};
