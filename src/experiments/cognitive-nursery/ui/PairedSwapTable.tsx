import React from 'react';
import { HistorySwapBranch } from '../types';
import { GitBranch, ShieldCheck, CheckCircle2, XCircle, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface PairedSwapTableProps {
  swapBranch: HistorySwapBranch | null;
  onRunSwap: () => void;
}

export const PairedSwapTable: React.FC<PairedSwapTableProps> = ({ swapBranch, onRunSwap }) => {
  if (!swapBranch) {
    return (
      <div className="p-8 text-center font-mono text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/60 space-y-3">
        <ArrowRightLeft className="w-8 h-8 text-cyan-500/50 mx-auto" />
        <div className="text-zinc-300 font-bold text-sm">No History Swap Branch Created Yet</div>
        <p className="max-w-md mx-auto text-zinc-400">
          Run the isolated History Swap experiment to test behavioral transfer across swapped histories without mutating the active 3-actor nursery session.
        </p>
        <button
          onClick={onRunSwap}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Execute Isolated Swap Trial</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Branch & Epistemic Statuses Header */}
      <div className="p-4 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-zinc-200">ISOLATED SWAP EXPERIMENT BRANCH</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              Branch: <strong className="text-zinc-200">{swapBranch.branchId}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              Parent Snapshot: <strong className="text-indigo-300">{swapBranch.parentSnapshotId}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              Parent Overwrites: <strong>0 (PRESERVED)</strong>
            </span>
          </div>
        </div>

        {/* Epistemic Status Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 space-y-1">
            <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>HISTORY_STATE_EFFECT</span>
            </div>
            <div className="text-sm font-bold text-emerald-300">
              {swapBranch.epistemicStatus.HISTORY_STATE_EFFECT}
            </div>
            <div className="text-[9px] text-zinc-400">
              Internal state & plasticity follow historical trajectory.
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 space-y-1">
            <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>CONFIDENCE/EVIDENCE_EFFECT</span>
            </div>
            <div className="text-sm font-bold text-emerald-300">
              {swapBranch.epistemicStatus.CONFIDENCE_EVIDENCE_EFFECT}
            </div>
            <div className="text-[9px] text-zinc-400">
              Evidence threshold strictly determined by experience ledger.
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-200 space-y-1">
            <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>BEHAVIORAL_TRANSFER</span>
            </div>
            <div className="text-sm font-bold text-amber-300">
              {swapBranch.epistemicStatus.BEHAVIORAL_TRANSFER} / UNDER_TEST
            </div>
            <div className="text-[9px] text-zinc-400">
              Transfer action shifts evaluated per task against prior policies.
            </div>
          </div>
        </div>
      </div>

      {/* Paired PRE-SWAP vs POST-SWAP Tasks Comparison */}
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {swapBranch.pairedComparisons.map((taskComp, idx) => (
          <div
            key={taskComp.taskId || idx}
            className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-400">{taskComp.taskId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Domain: {taskComp.domain}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Ground Truth: <strong className="text-emerald-400">{taskComp.groundTruth}</strong>
              </div>
            </div>

            <div className="text-[11px] text-zinc-300 bg-zinc-900/40 p-2 rounded border border-zinc-800/40">
              {taskComp.taskDescription}
            </div>

            {/* Paired Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                    <th className="py-2 px-2.5">Actor Label</th>
                    <th className="py-2 px-2.5">Inherited History</th>
                    <th className="py-2 px-2.5">Pre-Swap Action</th>
                    <th className="py-2 px-2.5">Post-Swap Action</th>
                    <th className="py-2 px-2.5 text-center">Action Changed</th>
                    <th className="py-2 px-2.5 text-center">Confidence (Pre → Post)</th>
                    <th className="py-2 px-2.5 text-center">Evidence Demand</th>
                    <th className="py-2 px-2.5 text-center">Correctness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {taskComp.comparisons.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-2.5 font-bold text-zinc-200">
                        {row.actorLabel}
                      </td>
                      <td className="py-2.5 px-2.5 text-zinc-400 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                          {row.inheritedHistory}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-zinc-300 font-mono text-[10px]">
                        {row.preSwap.action}
                      </td>
                      <td className="py-2.5 px-2.5 text-white font-mono text-[10px] font-semibold">
                        {row.postSwap.action}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.actionChanged
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {row.actionChanged ? 'CHANGED' : 'UNCHANGED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-[10px]">
                        <span className="text-zinc-400">{(row.preSwap.confidence * 100).toFixed(0)}%</span>
                        <span className="mx-1 text-zinc-600">→</span>
                        <span className="text-cyan-300 font-bold">{(row.postSwap.confidence * 100).toFixed(0)}%</span>
                        <span className="ml-1 text-[9px] text-zinc-500">
                          ({row.confidenceShift >= 0 ? '+' : ''}{(row.confidenceShift * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-[10px]">
                        <span className="text-zinc-400">{(row.preSwap.evidenceDemand * 100).toFixed(0)}%</span>
                        <span className="mx-1 text-zinc-600">→</span>
                        <span className="text-amber-300 font-bold">{(row.postSwap.evidenceDemand * 100).toFixed(0)}%</span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {row.preSwap.correctness ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                          <span className="text-zinc-600">→</span>
                          {row.postSwap.correctness ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
