import React, { useState, useEffect } from 'react';
import { WorkUnit, ProposedAction, WorkUnitStatus } from '../types';
import {
  FileText,
  User,
  Wrench,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Send,
  ShieldCheck,
  Sparkles,
  Edit3,
  Route,
  Clock
} from 'lucide-react';

interface Props {
  unit: WorkUnit;
  onProposeAction: (action: ProposedAction) => void;
}

export const WorkUnitDetail: React.FC<Props> = ({ unit, onProposeAction }) => {
  const [proposedStatus, setProposedStatus] = useState<WorkUnitStatus>(unit.status);
  const [proposedEvidence, setProposedEvidence] = useState<string>(unit.evidence);
  const [proposedRoute, setProposedRoute] = useState<string>(unit.nextRoute);
  const [rationale, setRationale] = useState<string>('');
  const [proposalSubmitted, setProposalSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setProposedStatus(unit.status);
    setProposedEvidence(unit.evidence);
    setProposedRoute(unit.nextRoute);
    setRationale('');
    setProposalSubmitted(false);
  }, [unit]);

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;

    const action: ProposedAction = {
      actionId: `PROP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetWorkUnitId: unit.id,
      targetWorkUnitName: unit.name,
      actionType: 'MUTATION_PROPOSAL',
      proposedState: {
        status: proposedStatus,
        evidence: proposedEvidence,
        nextRoute: proposedRoute,
      },
      rationale,
      status: 'PROPOSED_ACTION',
    };

    onProposeAction(action);
    setProposalSubmitted(true);
    setTimeout(() => setProposalSubmitted(false), 2500);
  };

  return (
    <div id="work-unit-detail-card" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 text-zinc-100 space-y-5 shadow-md">
      {/* Detail Header */}
      <div className="flex items-start justify-between pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
              {unit.id}
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
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
            {unit.staleState && (
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> STALE STATE
              </span>
            )}
            {unit.ownerGate && (
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3 text-purple-400" /> OWNER GATE
              </span>
            )}
          </div>
          <h3 className="text-base font-bold font-mono text-white tracking-tight">{unit.name}</h3>
        </div>
      </div>

      {/* Unit Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800">
          <span className="text-zinc-400 block mb-1 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Required Capability
          </span>
          <span className="text-indigo-200 font-semibold">{unit.capability}</span>
        </div>

        <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800">
          <span className="text-zinc-400 block mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-400" /> Assigned Agent
          </span>
          <span className="text-sky-200 font-semibold">{unit.assignedAgent}</span>
        </div>

        {unit.staleReason && (
          <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-800/80 col-span-1 md:col-span-2">
            <span className="text-amber-300 block font-bold mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Stale State Reason
            </span>
            <span className="text-amber-200 leading-relaxed">{unit.staleReason}</span>
          </div>
        )}

        {unit.gateRequirement && (
          <div className="bg-purple-950/40 p-3 rounded-lg border border-purple-800/80 col-span-1 md:col-span-2">
            <span className="text-purple-300 block font-bold mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Owner Security Requirement
            </span>
            <span className="text-purple-200 leading-relaxed">{unit.gateRequirement}</span>
          </div>
        )}

        {/* Evidence Trail */}
        <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 col-span-1 md:col-span-2">
          <span className="text-zinc-400 block mb-1.5 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Immutable Evidence &amp; Artifact Trail
          </span>
          <div className="text-zinc-200 leading-relaxed bg-zinc-900 p-2.5 rounded border border-zinc-800 font-sans text-xs">
            {unit.evidence}
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 col-span-1 md:col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-zinc-400 block text-[10px]">VERIFICATION STATUS</span>
              <span className="text-emerald-300 font-bold">{unit.verification.status} &bull; {unit.verification.verifiedBy}</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">{unit.verification.verifiedAt}</span>
        </div>
      </div>

      {/* PROPOSED_ACTION Mutation Form */}
      <form onSubmit={handleSubmitProposal} className="pt-4 border-t border-zinc-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate PROPOSED_ACTION (v0 Read-Only Invariant)</span>
          </h4>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            Write actions wrapper
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <label className="text-zinc-400 block mb-1">Proposed Status</label>
            <select
              value={proposedStatus}
              onChange={(e) => setProposedStatus(e.target.value as WorkUnitStatus)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="STALE">STALE</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Proposed Next Route</label>
            <input
              type="text"
              value={proposedRoute}
              onChange={(e) => setProposedRoute(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="text-zinc-400 block mb-1">Proposed Evidence Payload</label>
            <input
              type="text"
              value={proposedEvidence}
              onChange={(e) => setProposedEvidence(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="text-zinc-400 block mb-1">Action Rationale (Mandatory for PROPOSED_ACTION)</label>
            <textarea
              rows={2}
              required
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State the technical rationale for this proposed intervention..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!rationale.trim()}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition-colors border border-amber-400/30 shadow cursor-pointer"
          >
            {proposalSubmitted ? (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>PROPOSED_ACTION Sealed!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit PROPOSED_ACTION Envelope</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
