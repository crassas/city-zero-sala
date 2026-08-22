import React from 'react';
import { Cpu, AlertTriangle, CheckCircle, Lock, Layers, Activity } from 'lucide-react';
import { OperationsConsolePayload, DriveConnectionState } from '../types';

interface Props {
  payload: OperationsConsolePayload;
  driveStatus: DriveConnectionState;
  proposedActionCount: number;
}

export const ConsoleSummaryHeader: React.FC<Props> = ({ payload, driveStatus, proposedActionCount }) => {
  return (
    <div id="console-summary-card" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 text-zinc-100 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold bg-blue-950/90 text-blue-300 px-2.5 py-0.5 rounded border border-blue-700/60 uppercase tracking-wider">
              {payload.version} CANONICAL PAYLOAD
            </span>
            <span className="text-xs font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              Drive Target: <strong className="text-blue-300 font-semibold">{payload.sourceName}</strong> ({payload.sourceDriveId})
            </span>
            <span className="text-[10px] font-mono bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded border border-amber-700/80 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" /> STRICT READ-ONLY INVARIANT
            </span>
          </div>

          <h2 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <span>Graph Engineer Universal Operations Dashboard</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono flex items-center gap-2 flex-wrap">
            <span>Adapter Boundary: <strong className="text-emerald-400 font-semibold">{payload.adapterBoundary}</strong></span>
            <span>&bull;</span>
            <span>Last Bootstrapped: <strong className="text-zinc-300">{payload.lastBootstrapAt}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-950 px-4 py-2.5 rounded-lg border border-zinc-800 text-right shadow-inner">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Staged Proposals</span>
            <span className="text-base font-mono font-bold text-amber-400">{proposedActionCount} Envelopes</span>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800/90 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Total Units</span>
            <span className="text-base font-mono font-bold text-white">{payload.staleStateSummary.totalUnits} Units</span>
          </div>
        </div>

        <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800/90 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Verified Units</span>
            <span className="text-base font-mono font-bold text-emerald-400">{payload.staleStateSummary.activeCount} Units</span>
          </div>
        </div>

        <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800/90 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Stale / Pending</span>
            <span className="text-base font-mono font-bold text-amber-400">{payload.staleStateSummary.staleCount} Unit</span>
          </div>
        </div>

        <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800/90 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Owner Gates</span>
            <span className="text-base font-mono font-bold text-purple-400">{payload.ownerGates.length} Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
