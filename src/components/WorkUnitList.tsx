import React, { useState } from 'react';
import { WorkUnit } from '../types';
import {
  Cpu,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  User,
  Wrench
} from 'lucide-react';

interface Props {
  workUnits: WorkUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unit: WorkUnit) => void;
}

export const WorkUnitList: React.FC<Props> = ({ workUnits, selectedUnitId, onSelectUnit }) => {
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'STALE' | 'GATES' | 'BLOCKED'>('ALL');

  const filteredUnits = workUnits.filter(u => {
    if (filter === 'VERIFIED') return u.status === 'COMPLETED' || u.verification.status === 'VERIFIED';
    if (filter === 'STALE') return u.staleState;
    if (filter === 'GATES') return u.ownerGate;
    if (filter === 'BLOCKED') return u.status === 'BLOCKED';
    return true;
  });

  return (
    <div id="work-units-container" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 text-zinc-100 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/80">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>13 Canonical Work Units</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Direct ingestion from operations_console.v0 payload
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          <button
            id="filter-all"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            ALL ({workUnits.length})
          </button>
          <button
            id="filter-verified"
            onClick={() => setFilter('VERIFIED')}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              filter === 'VERIFIED'
                ? 'bg-emerald-600 text-white border border-emerald-400 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            VERIFIED ({workUnits.filter(u => u.status === 'COMPLETED' || u.verification.status === 'VERIFIED').length})
          </button>
          <button
            id="filter-stale"
            onClick={() => setFilter('STALE')}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              filter === 'STALE'
                ? 'bg-amber-600 text-white border border-amber-400 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            STALE ({workUnits.filter(u => u.staleState).length})
          </button>
          <button
            id="filter-gates"
            onClick={() => setFilter('GATES')}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              filter === 'GATES'
                ? 'bg-purple-600 text-white border border-purple-400 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            GATES ({workUnits.filter(u => u.ownerGate).length})
          </button>
          <button
            id="filter-blocked"
            onClick={() => setFilter('BLOCKED')}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              filter === 'BLOCKED'
                ? 'bg-rose-600 text-white border border-rose-400 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            BLOCKED ({workUnits.filter(u => u.status === 'BLOCKED').length})
          </button>
        </div>
      </div>

      {/* Work Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[660px] overflow-y-auto pr-1">
        {filteredUnits.map((unit) => {
          const isSelected = selectedUnitId === unit.id;

          return (
            <div
              key={unit.id}
              id={`work-unit-card-${unit.id}`}
              onClick={() => onSelectUnit(unit)}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                isSelected
                  ? 'bg-blue-950/80 border-blue-400/90 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {unit.id}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    unit.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : unit.status === 'BLOCKED'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : unit.status === 'ACTIVE'
                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {unit.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {unit.staleState && (
                    <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1" title={unit.staleReason}>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      STALE
                    </span>
                  )}
                  {unit.ownerGate && (
                    <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded flex items-center gap-1" title={unit.gateRequirement}>
                      <Lock className="w-3 h-3 text-purple-400" />
                      GATE
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-bold text-white font-mono leading-snug mb-1">
                {unit.name}
              </h4>

              <p className="text-xs font-mono text-indigo-300 mb-2 flex items-center gap-1.5 line-clamp-1">
                <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{unit.capability}</span>
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-sky-300 font-medium">
                  <User className="w-3 h-3 text-sky-400 shrink-0" /> {unit.assignedAgent}
                </span>

                <span className="flex items-center gap-1 text-zinc-400">
                  Next: <strong className="text-purple-300">{unit.nextRoute}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
