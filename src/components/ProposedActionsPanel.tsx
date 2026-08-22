import React, { useState } from 'react';
import { ProposedAction } from '../types';
import { Send, FileCode, Check, Copy, Terminal } from 'lucide-react';

interface Props {
  proposals: ProposedAction[];
}

export const ProposedActionsPanel: React.FC<Props> = ({ proposals }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (action: ProposedAction) => {
    navigator.clipboard.writeText(JSON.stringify(action, null, 2));
    setCopiedId(action.actionId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div id="proposed-actions-panel" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 text-zinc-100 space-y-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
            PROPOSED_ACTION Queue ({proposals.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-bold">
          v0 Read-Only Enforced
        </span>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-6 bg-zinc-950/60 border border-dashed border-zinc-800 rounded-lg p-4">
          <FileCode className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs font-mono text-zinc-400 font-medium">No write proposals in queue</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Mutations on operations_console.v0 generate a non-destructive PROPOSED_ACTION payload here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {proposals.map((action) => (
            <div key={action.actionId} className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-200 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-bold text-[11px] bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    {action.status}
                  </span>
                  <span className="text-blue-300 font-bold">{action.targetWorkUnitId} ({action.targetWorkUnitName})</span>
                </div>

                <button
                  onClick={() => handleCopy(action)}
                  className="text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 transition-colors cursor-pointer"
                >
                  {copiedId === action.actionId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-zinc-300 mb-2">
                <strong className="text-zinc-400">Rationale:</strong> {action.rationale}
              </p>

              <pre className="text-[10px] bg-zinc-900 p-2.5 rounded border border-zinc-800 text-emerald-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {JSON.stringify(action.proposedState, null, 2)}
              </pre>

              <span className="text-[10px] text-zinc-400 block text-right mt-1.5 font-mono">
                Logged at {new Date(action.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
