import React, { useState } from 'react';
import { HardDrive, AlertTriangle, CheckCircle2, Lock, ExternalLink, Play, LogOut, Loader2, FileCheck, ShieldCheck } from 'lucide-react';
import { DriveConnectionState } from '../types';
import { googleSignIn, logout } from '../lib/firebaseAuth';
import { executeDriveWriteProbe, DriveProbeResult } from '../lib/driveService';
import { User } from 'firebase/auth';

interface Props {
  driveStatus: DriveConnectionState;
  driveFolder?: string;
  user: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
}

export const DriveAdapterStatus: React.FC<Props> = ({
  driveStatus,
  driveFolder = "operations_console.v0",
  user,
  onAuthSuccess,
  onLogout
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<DriveProbeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err?.message || 'Falha ao autenticar com a Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRunProbe = async () => {
    setIsProbing(true);
    setErrorMessage(null);
    try {
      const res = await executeDriveWriteProbe();
      setProbeResult(res);
      if (res.status === 'DRIVE_WRITE_BLOCKED' && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setProbeResult({
        status: 'DRIVE_WRITE_BLOCKED',
        error: err?.message || String(err)
      });
      setErrorMessage(err?.message || String(err));
    } finally {
      setIsProbing(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setProbeResult(null);
    onLogout();
  };

  return (
    <div id="drive-adapter-panel" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 mb-6 text-zinc-200 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg border ${
            driveStatus === 'CONNECTED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <HardDrive className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Google Drive Adapter Boundary
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                driveStatus === 'CONNECTED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {driveStatus}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                scope: drive.file
              </span>
            </div>

            <p className="text-sm font-medium text-zinc-200 mt-1">
              Source Folder / Project: <span className="font-mono text-xs text-blue-300">{driveFolder}</span>
            </p>

            <div className="text-xs text-zinc-400 mt-1">
              {driveStatus === 'CONNECTED' && user ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sessão OAuth ativa com {user.email || user.displayName}. Scope drive.file pronto.
                </span>
              ) : (
                <span className="text-amber-400/90 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> OAuth provisionado no projeto. Clica em "Sign in with Google" para autenticar o cliente.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {driveStatus === 'CONNECTED' ? (
            <>
              <button
                id="btn-run-drive-probe"
                onClick={handleRunProbe}
                disabled={isProbing}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors border border-emerald-400/30 shadow-sm"
              >
                {isProbing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Executar DRIVE_WRITE_PROBE</span>
              </button>

              <button
                id="btn-logout"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2.5 rounded-lg border border-zinc-700 transition-colors"
                title="Terminar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <button
              id="btn-google-signin"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2.5 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {isSigningIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              <span>{isSigningIn ? 'A conectar...' : 'Sign in with Google'}</span>
            </button>
          )}

          <a
            id="link-open-google-drive"
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-2.5 rounded-lg border border-zinc-700 transition-colors"
          >
            <span>Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-200 text-xs font-mono">
          <p className="font-semibold text-red-300">Erro:</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {probeResult && (
        <div className={`mt-4 p-4 rounded-lg border font-mono text-xs ${
          probeResult.status === 'DRIVE_WRITE_VERIFIED'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
            : 'bg-red-950/60 border-red-800 text-red-200'
        }`}>
          <div className="flex items-center justify-between font-bold pb-2 border-b border-emerald-800/50">
            <span className="flex items-center gap-1.5">
              {probeResult.status === 'DRIVE_WRITE_VERIFIED' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">DRIVE_WRITE_VERIFIED</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">DRIVE_WRITE_BLOCKED</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-zinc-400">{new Date().toLocaleTimeString()}</span>
          </div>

          {probeResult.status === 'DRIVE_WRITE_VERIFIED' && (
            <div className="mt-2.5 space-y-1.5 text-zinc-300">
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span><strong>File ID:</strong> <span className="text-emerald-300 select-all">{probeResult.fileId}</span></span>
              </div>
              <div><strong>File Name:</strong> {probeResult.fileName}</div>
              <div><strong>Verified Content (Read-Back):</strong> {probeResult.verifiedContent}</div>
              <div className="text-[11px] text-emerald-400 pt-1">
                ✓ Upload multipart completado com sucesso & Leitura de integridade confirmada bit-a-bit.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

