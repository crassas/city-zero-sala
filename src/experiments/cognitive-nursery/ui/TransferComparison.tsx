import React from 'react';
import { TransferComparisonResult } from '../types';
import { Target, CheckCircle2, XCircle, ShieldCheck, Zap } from 'lucide-react';

interface TransferComparisonProps {
  results: TransferComparisonResult[];
}

export const TransferComparison: React.FC<TransferComparisonProps> = ({ results }) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-zinc-200">
            COMMON UNSEEN TRANSFER EVALUATION ({results.length} Tasks)
          </h3>
        </div>
      </div>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {results.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
            No transfer results yet. Click &quot;Run Common Transfer Test&quot; to benchmark all actors.
          </div>
        ) : (
          results.map((res, idx) => (
            <div
              key={idx}
              className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-400">{res.taskId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Divergence Score: <strong>{res.divergenceScore}</strong>
                </span>
              </div>

              <div className="text-xs text-zinc-300 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
                {res.taskDescription}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {res.actors.map((act) => (
                  <div
                    key={act.actor_id}
                    className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                      act.success
                        ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                        : 'bg-red-950/20 border-red-800/50 text-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate">{act.actor_id}</span>
                      {act.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                    </div>
                    <div>
                      Action: <strong className="text-white">{act.chosenAction}</strong>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex justify-between">
                      <span>Demand: {(act.evidenceDemanded * 100).toFixed(0)}%</span>
                      <span>Conf: {(act.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
