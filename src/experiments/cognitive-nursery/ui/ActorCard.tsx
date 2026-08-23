import React from 'react';
import { ActorState, Domain } from '../types';
import { Shield, Brain, Sparkles, AlertTriangle, Database, Activity } from 'lucide-react';

interface ActorCardProps {
  actor: ActorState;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const ActorCard: React.FC<ActorCardProps> = ({ actor, isSelected, onSelect }) => {
  const domains: Domain[] = ['TECHNICAL', 'SOCIAL', 'RISK', 'GOVERNANCE'];

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-zinc-900 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="font-mono font-bold text-xs text-zinc-200">{actor.actor_id}</span>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
          GEN {actor.generation} · SEED {actor.birth_seed}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mb-1">
            <Brain className="w-3 h-3 text-cyan-400" />
            <span>GLOBAL PLASTICITY</span>
          </div>
          <div className="text-sm font-mono font-bold text-cyan-300">
            {(actor.global_plasticity * 100).toFixed(1)}%
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all"
              style={{ width: `${actor.global_plasticity * 100}%` }}
            />
          </div>
        </div>

        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mb-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>EVIDENCE DEMAND</span>
          </div>
          <div className="text-sm font-mono font-bold text-amber-300">
            {(actor.evidence_demand_threshold * 100).toFixed(1)}%
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${actor.evidence_demand_threshold * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Domain Plasticity Badges */}
      <div className="mb-3">
        <div className="text-[10px] font-mono text-zinc-500 mb-1.5 uppercase">Domain Plasticity Trajectory</div>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
          {domains.map((d) => (
            <div key={d} className="flex justify-between items-center bg-zinc-950/40 px-2 py-1 rounded border border-zinc-800/50">
              <span className="text-zinc-400">{d.slice(0, 4)}:</span>
              <span className="font-bold text-zinc-200">
                {((actor.domain_plasticity[d] ?? 0.85) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Stats */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-400">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-purple-400" />
          <span>Stage: <strong className="text-purple-300">{actor.developmental_stage}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Mem: <strong className="text-zinc-200">{actor.memories.length}</strong></span>
          <span>Exp: <strong className="text-zinc-200">{actor.experience_ledger.length}</strong></span>
          {actor.contradictions_count > 0 && (
            <span className="text-red-400 font-bold">⚠️ {actor.contradictions_count}</span>
          )}
        </div>
      </div>

      {/* Metacognitive Alerts */}
      {actor.alerts.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex flex-col gap-1">
          {actor.alerts.slice(0, 2).map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/40">
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
              <span className="truncate">{a.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
