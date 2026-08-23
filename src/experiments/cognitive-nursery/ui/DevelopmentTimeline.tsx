import React from 'react';
import { ActorState } from '../types';
import { GitCommit, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DevelopmentTimelineProps {
  actor: ActorState;
}

export const DevelopmentTimeline: React.FC<DevelopmentTimelineProps> = ({ actor }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-emerald-400" />
          <h3 className="font-mono text-xs font-bold text-zinc-200">
            DEVELOPMENTAL TIMELINE & EXPERIENCE LEDGER ({actor.experience_ledger.length} Events)
          </h3>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {actor.experience_ledger.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
            No developmental experiences recorded yet. Run episodes or curriculum tasks to observe adaptation.
          </div>
        ) : (
          actor.experience_ledger
            .slice()
            .reverse()
            .map((e) => (
              <div
                key={e.id}
                className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 font-mono text-xs space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-300">#{e.sequence}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {e.domain}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        e.evidenceStatus === 'VERIFIED'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : 'bg-red-950/60 text-red-300 border border-red-800/60'
                      }`}
                    >
                      {e.evidenceStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{e.environmentId}</span>
                </div>

                <div className="text-[11px] text-zinc-300">
                  <strong>Observation:</strong> {e.observation}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
                  <div>
                    <span className="text-zinc-500 text-[10px]">Chosen Action:</span>
                    <div className="font-semibold text-cyan-300 truncate">{e.chosenAction}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px]">Actual Outcome:</span>
                    <div className="font-semibold text-zinc-300 truncate">{e.actualOutcome}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400">
                  <div className="flex gap-3">
                    <span>Surprise: <strong className="text-amber-300">{(e.surprise * 100).toFixed(0)}%</strong></span>
                    <span>Plasticity: <strong>{e.plasticityBefore.toFixed(2)} → {e.plasticityAfter.toFixed(2)}</strong></span>
                  </div>
                  <span className="truncate max-w-[200px] text-zinc-500">{e.provenance}</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
