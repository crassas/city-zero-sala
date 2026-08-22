import React, { useState, useEffect } from 'react';
import { fetchDriveFile, createAndVerifyDriveFile } from '../lib/driveService';
import { DriveConnectionState } from '../types';
import { Loader2, CheckCircle2, AlertTriangle, FileCheck, ShieldCheck } from 'lucide-react';

interface IntentPayload {
  id: string;
  action: string;
  targetDriveId: string;
  timestamp: string;
}

interface IntentHandlerProps {
  driveStatus: DriveConnectionState;
}

export const IntentHandler: React.FC<IntentHandlerProps> = ({ driveStatus }) => {
  const [intent, setIntent] = useState<IntentPayload | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Poll for intent.json
    const checkIntent = async () => {
      try {
        const res = await fetch('/intent.json?t=' + Date.now());
        if (res.ok) {
          const data: IntentPayload = await res.json();
          // Avoid re-executing if it's the same intent
          const lastExecuted = localStorage.getItem('last_executed_intent');
          if (data && data.id !== lastExecuted) {
            setIntent(data);
          }
        }
      } catch (err) {
        // Silently fail if intent file doesn't exist
      }
    };
    checkIntent();
    const interval = setInterval(checkIntent, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteIntent = async () => {
    if (!intent) return;
    if (driveStatus !== 'CONNECTED') {
      setErrorMsg("Drive status is not CONNECTED. Please sign in via the Drive Adapter Boundary below.");
      return;
    }

    setIsExecuting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      if (intent.action === 'BRIDGE_ACCEPTANCE_TEST') {
        const fetchRes = await fetchDriveFile(intent.targetDriveId);
        if (!fetchRes.success) {
          setErrorMsg(fetchRes.error || "Failed to fetch source drive file");
          setIsExecuting(false);
          return;
        }

        const createRes = await createAndVerifyDriveFile(
          `bridge_acceptance_receipt_${Date.now()}.json`,
          JSON.stringify({
            instruction_source_id: intent.targetDriveId,
            fetched_content: fetchRes.content,
            timestamp: new Date().toISOString(),
            acceptance_status: "VERIFIED",
            intent_id: intent.id
          }, null, 2),
          "Bridge Acceptance Test Artifact"
        );

        if (createRes.status !== 'DRIVE_WRITE_VERIFIED') {
          setErrorMsg(createRes.error || "Failed to verify drive write");
        } else {
          setResult({ type: 'BRIDGE_ACCEPTANCE_COMPLETE', ...createRes });
          // Mark as executed
          localStorage.setItem('last_executed_intent', intent.id);
        }
      } else if (intent.action === 'DIAGNOSTIC_READ_ONLY') {
        const fetchRes = await fetchDriveFile(intent.targetDriveId);
        if (!fetchRes.success) {
          setErrorMsg(fetchRes.error || "Failed to fetch source drive file");
        } else {
          setResult({ 
            type: 'DIAGNOSTIC_READ_COMPLETE', 
            content: fetchRes.content,
            sourceId: intent.targetDriveId
          });
          
          fetch('/api/save-content', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: intent.targetDriveId, content: fetchRes.content })
          }).catch(() => {});
          
          localStorage.setItem('last_executed_intent', intent.id);
        }
      } else {
        setErrorMsg(`Unknown intent action: ${intent.action}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setIsExecuting(false);
    }
  };

  if (!intent) return null; // Hide if no pending intent

  return (
    <div className="bg-zinc-900 border-l-2 border-l-emerald-500 border-y border-r border-zinc-800 rounded-r-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-950 text-emerald-500 rounded-md border border-zinc-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-sans text-zinc-50 flex items-center gap-2">
              Intent Emitted: {intent.action}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Target Drive ID: <span className="text-zinc-300">{intent.targetDriveId}</span>
            </p>
          </div>
        </div>
      </div>
      {!result && !errorMsg && (
        <div className="mt-4 pt-4 border-t border-zinc-800/50">
          <p className="text-xs font-sans text-zinc-400 mb-3">
            The preview handler has intercepted this intent. Execute the operation with your active OAuth session.
          </p>
          <button
            onClick={handleExecuteIntent}
            disabled={isExecuting || driveStatus !== 'CONNECTED'}
            className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-900 disabled:opacity-50 px-4 py-2 rounded-md font-sans text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            {isExecuting ? (
              <><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /> Executing Intent...</>
            ) : (
              <>Accept & Execute</>
            )}
          </button>
          {driveStatus !== 'CONNECTED' && (
            <p className="text-[10px] text-amber-500 font-sans mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Connect Google Drive first using the Drive Adapter below.
            </p>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3 bg-zinc-950 border border-red-900/50 rounded-lg text-red-400 font-sans text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Execution Failed</span>
            <span>{errorMsg}</span>
            <div className="mt-3">
              <button 
                onClick={handleExecuteIntent}
                className="text-xs bg-red-950 hover:bg-red-900 border border-red-900 text-red-300 px-3 py-1 rounded cursor-pointer"
              >
                Retry Execution
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-zinc-950 border border-emerald-900/50 rounded-lg text-emerald-300 font-sans text-xs space-y-2">
          {result.type === 'BRIDGE_ACCEPTANCE_COMPLETE' ? (
            <>
              <div className="flex items-center justify-between font-bold pb-2 border-b border-emerald-900/50">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-400 font-bold tracking-tight">Acceptance Complete</span>
                </span>
              </div>
              <div className="space-y-2 text-zinc-400">
                <div className="flex items-center gap-2 pt-1">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span>New Receipt File ID: <span className="text-emerald-400 font-mono select-all bg-emerald-950/30 px-1.5 py-0.5 rounded">{result.fileId}</span></span>
                </div>
                <div>Source ID: <span className="text-zinc-300 font-mono">{intent.targetDriveId}</span></div>
                <div className="text-[11px] text-emerald-500 font-mono">
                  ✓ readback_verified=true
                </div>
              </div>
            </>
          ) : result.type === 'DIAGNOSTIC_READ_COMPLETE' ? (
            <>
              <div className="flex items-center justify-between font-bold pb-2 border-b border-emerald-900/50">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-400 font-bold tracking-tight">Diagnostic Read Complete</span>
                </span>
              </div>
              <div className="space-y-2 text-zinc-400 mt-2">
                <div>Source ID: <span className="text-zinc-300 font-mono">{result.sourceId}</span></div>
                <div className="mt-3 pt-3 border-t border-zinc-800/80">
                  <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider block mb-2">File Content Snippet</span>
                  <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-md text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-40 font-mono text-[10px] leading-relaxed">
                    {result.content.substring(0, 500)}{result.content.length > 500 ? '...' : ''}
                  </pre>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
