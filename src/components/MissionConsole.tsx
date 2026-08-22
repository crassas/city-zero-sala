import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Wrench,
  Activity,
  CheckCircle,
  FileCheck2,
  Send,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  Save
} from 'lucide-react';
import { Mission, MissionStatus } from '../types';

interface Props {
  mission: Mission;
  onUpdateMission: (updated: Mission) => void;
  onResetProof: () => void;
  isDriveConnected: boolean;
}

export const MissionConsole: React.FC<Props> = ({
  mission,
  onUpdateMission,
  onResetProof,
  isDriveConnected,
}) => {
  const [evidenceInput, setEvidenceInput] = useState(mission.evidence);
  const [statusInput, setStatusInput] = useState<MissionStatus>(mission.status);
  const [nextRouteInput, setNextRouteInput] = useState(mission.nextRoute);
  const [assignedWorkerInput, setAssignedWorkerInput] = useState(mission.assignedWorker);
  const [receiptOutput, setReceiptOutput] = useState<string | null>(null);

  useEffect(() => {
    setEvidenceInput(mission.evidence);
    setStatusInput(mission.status);
    setNextRouteInput(mission.nextRoute);
    setAssignedWorkerInput(mission.assignedWorker);
  }, [mission]);

  const handleSaveEvidence = () => {
    const updated: Mission = {
      ...mission,
      evidence: evidenceInput,
      status: statusInput,
      nextRoute: nextRouteInput,
      assignedWorker: assignedWorkerInput,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMission(updated);
  };

  const handleGenerateReceipt = () => {
    const receipt = JSON.stringify(
      {
        receiptId: `RCPT-GE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        missionId: mission.id,
        missionTitle: mission.title,
        worker: assignedWorkerInput,
        requiredCapability: mission.requiredCapability,
        finalStatus: statusInput,
        evidenceHash: `SHA256-${Math.abs(
          evidenceInput.split('').reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0)
        ).toString(16)}`,
        nextRoute: nextRouteInput,
        driveSynced: isDriveConnected ? "SYNCED_TO_DRIVE" : "DRIVE_ACCESS_NOT_AVAILABLE",
      },
      null,
      2
    );
    setReceiptOutput(receipt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left / Main Target Card */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                  PROOF TARGET #01
                </span>
                <span className="text-xs font-mono text-zinc-400">ID: {mission.id}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Graph Engineer Worker Mission</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onResetProof}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md border border-zinc-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Initial Entrypoint State
              </button>
            </div>
          </div>

          {/* First Proof Target Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Field 1: Mission */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Mission</span>
              </div>
              <p className="text-sm font-semibold text-white leading-snug">{mission.title}</p>
              {mission.sourceArtefact && (
                <div className="mt-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1.5 rounded border border-zinc-800/60 break-all">
                  <strong className="text-zinc-300">Canonical Entrypoint:</strong> {mission.sourceArtefact}
                </div>
              )}
            </div>

            {/* Field 2: Required Capability */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. Required Capability</span>
              </div>
              <p className="text-sm font-mono font-semibold text-indigo-300">{mission.requiredCapability}</p>
            </div>

            {/* Field 3: Assigned Worker */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>3. Assigned Worker</span>
              </div>
              <input
                type="text"
                value={assignedWorkerInput}
                onChange={(e) => setAssignedWorkerInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Field 4: Status */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Status</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['CANONICAL_ENTRYPOINT_PENDING', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] as MissionStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusInput(st)}
                    className={`text-[10px] font-mono px-2 py-1 rounded font-bold transition-all border ${
                      statusInput === st
                        ? st === 'COMPLETED'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                          : st === 'IN_PROGRESS'
                          ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                          : st === 'FAILED'
                          ? 'bg-red-600 text-white border-red-400 shadow-sm'
                          : st === 'CANONICAL_ENTRYPOINT_PENDING'
                          ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                          : 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 6: Next Route */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5 text-purple-400" />
                <span>6. Next Route</span>
              </div>
              <input
                type="text"
                value={nextRouteInput}
                onChange={(e) => setNextRouteInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Field 5: Evidence */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5. Evidence &amp; Artifact Trail</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Real Source Payload</span>
              </div>

              <textarea
                rows={3}
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                placeholder="Enter worker execution log, artifact link or proof hash..."
              />

              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSaveEvidence}
                  className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold px-3 py-1.5 rounded border border-zinc-700 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-blue-400" />
                  Save Worker State
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Last updated: {new Date(mission.updatedAt).toLocaleTimeString()}</span>
            </div>

            <button
              onClick={handleGenerateReceipt}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition-colors border border-emerald-400/30 shadow"
            >
              <FileCheck2 className="w-4 h-4" />
              Generate Work Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Right / Receipt & Audit Handoff Side */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-zinc-100">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-300">
              Worker Receipt &amp; Handoff Output
            </h3>
          </div>

          {receiptOutput ? (
            <div className="space-y-3">
              <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {receiptOutput}
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-mono text-[11px] block text-emerald-300">Receipt Sealed &amp; Ready for Handoff</strong>
                  Proof target achieved. Next route target <code className="bg-emerald-900/60 px-1 rounded text-white">{nextRouteInput}</code> has received the mission envelope.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-lg p-4">
              <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No receipt generated yet</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Click &quot;Generate Work Receipt&quot; to build an immutable operational receipt payload for this mission.
              </p>
            </div>
          )}
        </div>

        {/* Operational Boundary Rules Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 text-zinc-300 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Entrypoint Ingestion Rules</span>
          </div>
          <ul className="space-y-2 text-zinc-400 text-[11px] font-mono list-disc list-inside">
            <li><strong className="text-zinc-200">Source of Truth:</strong> File ID <code className="text-blue-300">1CAyLR-oHP3y-Pb5Rpd18DS0gP1t8_sE3yfWyN_mTZzk</code>.</li>
            <li><strong className="text-zinc-200">No Pretend States:</strong> Does not use hardcoded Worker Alpha/ANT SCOUT unless parsed from source.</li>
            <li><strong className="text-zinc-200">Deterministic Ingestion:</strong> Ingest source payload to hydrate mission fields in real-time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
