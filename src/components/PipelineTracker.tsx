import React from 'react';
import { ArrowRight, CheckCircle2, CircleDot, Clock } from 'lucide-react';
import { MissionStatus } from '../types';

interface Props {
  currentStatus: MissionStatus;
}

const STEPS = [
  { id: 'inbox', label: 'MISSION INBOX', desc: 'State Received' },
  { id: 'route', label: 'ROUTE TO WORKER', desc: 'Capability Match' },
  { id: 'result', label: 'WORK RESULT', desc: 'Execution & Evidence' },
  { id: 'verify', label: 'VERIFY', desc: 'Audit Check' },
  { id: 'receipt', label: 'RECEIPT', desc: 'Proof Generated' },
  { id: 'handoff', label: 'HANDOFF / NEXT WORKER', desc: 'Next Route' },
];

export const PipelineTracker: React.FC<Props> = ({ currentStatus }) => {
  const getStepActiveIndex = (status: MissionStatus): number => {
    switch (status) {
      case 'PENDING': return 1;
      case 'IN_PROGRESS': return 3;
      case 'COMPLETED': return 6;
      case 'FAILED': return 2;
      default: return 1;
    }
  };

  const activeIndex = getStepActiveIndex(currentStatus);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 mb-6 text-zinc-200">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
            Graph Engineer Pipeline Lifecycle
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Deterministic worker mission execution and receipt generation flow
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded border border-zinc-700">
          Flow Step {activeIndex} of {STEPS.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < activeIndex;
          const isCurrent = stepNum === activeIndex;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : isCurrent
                  ? 'bg-blue-950/40 border-blue-500/60 text-blue-200 ring-1 ring-blue-500/30'
                  : 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider opacity-75">
                    0{stepNum}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <CircleDot className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </div>
                <h3 className="text-xs font-bold font-mono tracking-tight leading-tight">
                  {step.label}
                </h3>
              </div>
              <p className="text-[10px] opacity-70 mt-2 font-mono">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
