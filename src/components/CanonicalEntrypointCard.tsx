import React, { useState } from 'react';
import { FileCode, ExternalLink, Download, Sparkles, Check, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { CanonicalEntrypoint, Mission, CapabilityProbe } from '../types';
import { fetchDriveFile, runCapabilityProbe } from '../lib/driveService';

interface Props {
  entrypoint: CanonicalEntrypoint;
  onIngestSource: (parsedMission: Mission, rawText: string) => void;
}

export const CanonicalEntrypointCard: React.FC<Props> = ({ entrypoint, onIngestSource }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [ingestSuccess, setIngestSuccess] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<CapabilityProbe | null>(null);

  const handleRunProbe = async () => {
    setIsProbing(true);
    setProbeResult(null);
    try {
      const result = await runCapabilityProbe(entrypoint.fileId);
      setProbeResult(result);
    } catch (e: any) {
      setProbeResult({
        DRIVE_AUTH: 'UNKNOWN',
        DRIVE_READ: 'UNKNOWN',
        DRIVE_CREATE: 'UNKNOWN',
        DRIVE_READBACK: 'UNKNOWN',
        error: e.message
      });
    } finally {
      setIsProbing(false);
    }
  };

  const handleFetchFromDrive = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await fetchDriveFile(entrypoint.fileId);
      if (response.success && response.content) {
        setInputText(response.content);
        // Automatically attempt to parse and ingest if fetch was successful
        handleParseAndIngestContent(response.content);
      } else {
         setFetchError(response.error || "Failed to fetch file from Drive.");
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch file from Drive.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleParseAndIngestContent = (text: string) => {
    if (!text.trim()) return;

    let parsedMission: Mission;

    // Try parsing as JSON first if the user pastes operations_console.v0 JSON payload
    try {
      const obj = JSON.parse(text);
      parsedMission = {
        id: obj.id || obj.missionId || `MSN-OP-CONSOLE-V0`,
        title: obj.title || obj.mission || obj.name || "operations_console.v0 Mission",
        requiredCapability: obj.requiredCapability || obj.capability || "operations_console.v0 Engine",
        assignedWorker: obj.assignedWorker || obj.worker || "Worker Assigned via operations_console.v0",
        status: (['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(obj.status?.toUpperCase())
          ? obj.status.toUpperCase()
          : 'IN_PROGRESS') as any,
        evidence: typeof obj.evidence === 'string' ? obj.evidence : JSON.stringify(obj.evidence || obj, null, 2),
        nextRoute: obj.nextRoute || obj.route || "NEXT_OPERATIONS_WORKER",
        sourceArtefact: `Google Drive File ID: ${entrypoint.fileId} (operations_console.v0)`,
        updatedAt: new Date().toISOString()
      };
    } catch {
      // Robust text line parsing fallback
      const lines = text.split('\n');
      let title = "operations_console.v0 Executable Mission";
      let requiredCapability = "operations_console.v0 Engine Capability";
      let assignedWorker = "Worker Assigned via operations_console.v0";
      let status: any = "IN_PROGRESS";
      let evidence = text.slice(0, 400);
      let nextRoute = "NEXT_DOWNSTREAM_WORKER";

      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('mission:') || lower.includes('missão:') || lower.includes('objective:')) {
          title = line.split(':')[1]?.trim() || title;
        }
        if (lower.includes('capability:') || lower.includes('capacidade:')) {
          requiredCapability = line.split(':')[1]?.trim() || requiredCapability;
        }
        if (lower.includes('worker:') || lower.includes('trabalhador:') || lower.includes('assigned:')) {
          assignedWorker = line.split(':')[1]?.trim() || assignedWorker;
        }
        if (lower.includes('status:')) {
          const parsedSt = line.split(':')[1]?.trim().toUpperCase();
          if (['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(parsedSt)) {
            status = parsedSt;
          }
        }
        if (lower.includes('route:') || lower.includes('rota:') || lower.includes('next:')) {
          nextRoute = line.split(':')[1]?.trim() || nextRoute;
        }
      });

      parsedMission = {
        id: `MSN-OP-${entrypoint.fileId.slice(0, 8)}`,
        title,
        requiredCapability,
        assignedWorker,
        status,
        evidence: evidence || `Ingested from operations_console.v0 (${entrypoint.fileId})`,
        nextRoute,
        sourceArtefact: `Google Drive File ID: ${entrypoint.fileId} (operations_console.v0)`,
        updatedAt: new Date().toISOString()
      };
    }

    onIngestSource(parsedMission, text);
    setIngestSuccess(true);
    setTimeout(() => {
      setIngestSuccess(false);
      setIsOpen(false);
    }, 1200);
  };
  
  const handleParseAndIngest = () => {
    handleParseAndIngestContent(inputText);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 mb-6 text-zinc-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Real Payload Source
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold">
                operations_console.v0
              </span>
            </div>
            <p className="text-sm font-mono font-semibold text-white mt-1">
              File ID: <span className="text-blue-300">15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Canonical operational specification payload (No mock data).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
             onClick={handleRunProbe}
             disabled={isProbing}
             className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-colors border border-purple-400/30 shadow"
          >
             {isProbing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
             Phase 0 Probe
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-colors border border-blue-400/30 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            {isOpen ? "Close Payload Panel" : "Ingest operations_console.v0 Payload"}
          </button>
          <button
             onClick={handleFetchFromDrive}
             disabled={isFetching}
             className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-colors border border-emerald-400/30 shadow"
          >
             {isFetching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
             Fetch from Drive
          </button>
        </div>
      </div>

      {probeResult && (
        <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono">
          <div className="font-bold text-purple-400 mb-2 border-b border-zinc-800 pb-2">PHASE 0: CAPABILITY PROBE RESULTS</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-zinc-500">DRIVE_AUTH:</span><br/>
              <span className={probeResult.DRIVE_AUTH === 'VERIFIED' ? 'text-emerald-400 font-bold' : probeResult.DRIVE_AUTH === 'BLOCKED' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>{probeResult.DRIVE_AUTH}</span>
            </div>
            <div>
              <span className="text-zinc-500">DRIVE_READ:</span><br/>
              <span className={probeResult.DRIVE_READ === 'VERIFIED' ? 'text-emerald-400 font-bold' : probeResult.DRIVE_READ === 'BLOCKED' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>{probeResult.DRIVE_READ}</span>
            </div>
            <div>
              <span className="text-zinc-500">DRIVE_CREATE:</span><br/>
              <span className={probeResult.DRIVE_CREATE === 'VERIFIED' ? 'text-emerald-400 font-bold' : probeResult.DRIVE_CREATE === 'BLOCKED' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>{probeResult.DRIVE_CREATE}</span>
            </div>
            <div>
              <span className="text-zinc-500">DRIVE_READBACK:</span><br/>
              <span className={probeResult.DRIVE_READBACK === 'VERIFIED' ? 'text-emerald-400 font-bold' : probeResult.DRIVE_READBACK === 'BLOCKED' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>{probeResult.DRIVE_READBACK}</span>
            </div>
          </div>
          {probeResult.error && (
            <div className="mt-3 text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
              Error: {probeResult.error}
            </div>
          )}
        </div>
      )}

      {fetchError && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-zinc-800 bg-zinc-950/80 p-4 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Paste operations_console.v0 Content (Text or JSON)
            </label>
            <span className="text-[10px] font-mono text-zinc-500">
              Drive File: 15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w
            </span>
          </div>
          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Paste raw text or JSON specification from operations_console.v0...\n\nExample JSON:\n{\n  "mission": "Graph Universal Orchestration",\n  "requiredCapability": "Operations Engine v0",\n  "assignedWorker": "Worker Delta",\n  "status": "IN_PROGRESS",\n  "nextRoute": "VERIFIER_CORE"\n}`}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg p-3 text-xs font-mono text-zinc-100 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Hydrates real operations_console.v0 interface state directly.</span>
            </div>
            <button
              onClick={handleParseAndIngest}
              disabled={!inputText.trim()}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition-colors border border-emerald-400/30"
            >
              {ingestSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Payload Ingested!
                </>
              ) : (
                "Hydrate Real Payload"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
