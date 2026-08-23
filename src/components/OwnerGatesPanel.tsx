import React from 'react';
import { OwnerGateItem } from '../types';
import { Lock, Shield, Unlock } from 'lucide-react';

interface Props {
  gates: OwnerGateItem[];
}

export const OwnerGatesPanel: React.FC<Props> = ({ gates }) => {
  return (
    <div id="owner-gates-panel" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 text-zinc-100 space-y-3 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
            Global Owner Security Gates ({gates.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-bold">
          Protected Invariants
        </span>
      </div>

      <div className="space-y-2.5 font-mono text-xs">
        {gates.map((gate) => (
          <div
            key={gate.gateId}
            id={`gate-card-${gate.gateId}`}
            className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg flex items-center justify-between gap-3 shadow-inner"
          >
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-zinc-200 font-bold">{gate.gateId}</span>
                <span className="text-[10px] text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-900">
                  Role: {gate.requiredRole}
                </span>
              </div>
              <p className="text-zinc-400 text-xs font-sans">{gate.description}</p>
            </div>

            <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border shrink-0 ${
              gate.status === 'LOCKED'
                ? 'bg-purple-950 text-purple-300 border-purple-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {gate.status === 'LOCKED' ? <Lock className="w-3 h-3 text-purple-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              {gate.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
