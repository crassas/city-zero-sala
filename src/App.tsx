import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConsoleSummaryHeader } from './components/ConsoleSummaryHeader';
import { CanonicalEntrypointCard } from './components/CanonicalEntrypointCard';
import { DriveAdapterStatus } from './components/DriveAdapterStatus';
import { CityVisualizer } from './components/CityVisualizer';
import { WorkUnitList } from './components/WorkUnitList';
import { WorkUnitDetail } from './components/WorkUnitDetail';
import { ProposedActionsPanel } from './components/ProposedActionsPanel';
import { OwnerGatesPanel } from './components/OwnerGatesPanel';
import { OPERATIONS_CONSOLE_V0_PAYLOAD } from './data/operationsConsoleV0';
import { IntentHandler } from './components/IntentHandler';
import { WorkUnit, ProposedAction, DriveConnectionState, CanonicalEntrypoint, Mission, RuntimeEvent } from './types';
import { initAuth, googleSignIn, logout } from './lib/firebaseAuth';
import { User } from 'firebase/auth';
import { AgentRuntimeInstance } from './runtime/AgenticRuntime';
import { EventBus } from './game/EventBus';
import { EvidenceLedger } from './components/EvidenceLedger';
import { CognitiveNurseryLab } from './experiments/cognitive-nursery/ui/CognitiveNurseryLab';
import { ArrowRight, Building2, ShieldAlert, Sparkles, Map, BriefcaseBusiness, FileCheck2, Bell, MoreHorizontal, LockKeyhole, ChevronRight, Activity, CircleAlert, FlaskConical } from 'lucide-react';

export default function App() {
  const [payload, setPayload] = useState(OPERATIONS_CONSOLE_V0_PAYLOAD);
  const [selectedUnit, setSelectedUnit] = useState<WorkUnit>(payload.workUnits[0]);
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  const [driveStatus, setDriveStatus] = useState<DriveConnectionState>('DRIVE_ACCESS_NOT_AVAILABLE');
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'CONSOLE' | 'CITY' | 'LEDGER' | 'NURSERY'>('CONSOLE');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [runtimeMessage, setRuntimeMessage] = useState('BLOCKED — AUTH REQUIRED');
  
  const [canonicalEntrypoint] = useState<CanonicalEntrypoint>({
    fileId: '15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w',
    docUrl: 'https://docs.google.com/document/d/15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w/edit',
    loaded: true,
    lastSyncAttempt: new Date().toISOString()
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setDriveStatus('CONNECTED');
      },
      () => {
        setUser(null);
        setDriveStatus('DRIVE_ACCESS_NOT_AVAILABLE');
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsAuthenticating(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setDriveStatus('CONNECTED');
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUserLogout = async () => {
    await logout();
    setUser(null);
    setDriveStatus('DRIVE_ACCESS_NOT_AVAILABLE');
  };

  const handleIngestSource = (parsedMission: Mission, rawText: string) => {
    console.log('Ingested Source:', parsedMission, rawText);
    // You could update payload here if you wanted.
  };

  const handleRunAgentRuntimeTest = async () => {
    const readOnlyUnit = payload.workUnits.find(wu => !wu.ownerGate) || payload.workUnits[0];
    
    try {
      setRuntimeMessage('REQUESTING ADMISSION');
    const ticket = await AgentRuntimeInstance.requestAdmission(
        'Agentic_Runtime_V1',
        'MSN-OP-CONSOLE-V0',
        readOnlyUnit.id,
        payload.sourceDriveId
      );
      
      setRuntimeMessage('RUNNING VERIFIED LOOP');

      // Listen for blocked events
      let blockedError: string | null = null;
      const onEvent = (event: RuntimeEvent) => {
        const anyEvent = event as any;
        if (event.type === 'BLOCKED' && anyEvent.ticket?.ENTRY_ID === ticket.ENTRY_ID) {
          blockedError = anyEvent.message || 'BLOCKED';
        }
      };
      
      EventBus.on('runtime-event', onEvent);

    await AgentRuntimeInstance.executeMicroWorkerLoop(ticket, readOnlyUnit);
    
    EventBus.off('runtime-event', onEvent);

    if (blockedError) {
      throw new Error(blockedError);
    }

    setRuntimeMessage('COMPLETED — VERIFY EVIDENCE LEDGER');
      
    } catch (err: any) {
      console.error("Runtime error", err);
      setRuntimeMessage('FAILED — ' + (err?.message || 'UNKNOWN RUNTIME ERROR'));
    }
  };

  const handleAuthSuccess = async () => {
  setIsAuthenticating(true);
  try {
    const result = await googleSignIn();
    if (result) {
      setUser(result.user);
      setDriveStatus('CONNECTED');
    }
  } catch (error) {
    console.error('Google Drive authentication failed:', error);
    setUser(null);
    setDriveStatus('DRIVE_ACCESS_NOT_AVAILABLE');
  } finally {
    setIsAuthenticating(false);
  }
};

const handleLogout = async () => {
  await logout();
  setUser(null);
  setDriveStatus('DRIVE_ACCESS_NOT_AVAILABLE');
};

const handleProposeAction = (action: ProposedAction) => {
  setProposedActions(prev => [action, ...prev]);
};

const handleExecuteTarget = (driveId: string, customPayloadText?: string) => {
    // Dynamically align active target in payload
    setPayload(prev => ({
      ...prev,
      sourceDriveId: driveId,
      sourceName: `Target: ${driveId}`
    }));

    if (customPayloadText && customPayloadText.trim()) {
      handleProposeAction({
        actionId: `PROP-INGEST-${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetWorkUnitId: selectedUnit.id,
        targetWorkUnitName: selectedUnit.name,
        actionType: 'EVIDENCE_PROPOSAL',
        proposedState: {
          evidence: customPayloadText.slice(0, 300)
        },
        rationale: `Ingestão de especificação a partir do Drive ID ${driveId}`,
        status: 'PROPOSED_ACTION'
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-blue-600 selection:text-white">
      <Header connected={driveStatus === 'CONNECTED' && !!user} />

      {viewMode === 'CITY' ? (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col">
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-100">A CIDADE</h2>
              <p className="text-xs text-zinc-400">Explora as casas e vê o que cada uma representa.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('LEDGER')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-xs shadow-md transition-colors"
              >
                EVIDÊNCIAS
              </button>
              <button 
                onClick={() => setViewMode('CONSOLE')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs shadow-md transition-colors"
              >
                VOLTAR AO INÍCIO
              </button>
            </div>
          </div>
          <div className="flex-grow">
            <CityVisualizer 
              workUnits={payload.workUnits} 
              ownerGates={payload.ownerGates}
              driveStatus={driveStatus}
              onSelectUnit={(unit) => {
                setSelectedUnit(unit);
                // stay in city; inspector owns selection
              }} 
            />
          </div>
        </div>
      ) : viewMode === 'LEDGER' ? (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col">
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-purple-400">XSTATE SOCIETY RUNTIME LEDGER</h2>
              <p className="text-xs text-zinc-400">Strict deterministic actor execution and event trace.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('CITY')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold text-xs shadow-md transition-colors"
              >
                CITY RENDERER
              </button>
              <button 
                onClick={() => setViewMode('CONSOLE')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs shadow-md transition-colors"
              >
                RETURN TO CONSOLE
              </button>
            </div>
          </div>
          <div className="flex-grow">
            <EvidenceLedger />
          </div>
        </div>
      ) : viewMode === 'NURSERY' ? (
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col p-4">
          <div className="mb-4 flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
              <span className="font-mono text-xs font-bold text-zinc-200">DEVELOPMENTAL COGNITION NURSERY v0.2</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('CITY')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-mono font-bold text-xs transition-colors"
              >
                CITY
              </button>
              <button
                onClick={() => setViewMode('LEDGER')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded font-mono font-bold text-xs transition-colors"
              >
                LEDGER
              </button>
              <button
                onClick={() => setViewMode('CONSOLE')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded font-mono font-bold text-xs transition-colors"
              >
                CONSOLE
              </button>
            </div>
          </div>
          <CognitiveNurseryLab />
        </div>
      ) : (
        <main className="premium-shell">
          <section className="command-hero" aria-labelledby="command-title">
            <div className="command-hero__content">
              <span className="eyebrow"><Sparkles className="h-3.5 w-3.5"/> A tua cidade</span>
              <h2 id="command-title">Está tudo tranquilo.<br/><span>Entra quando quiseres.</span></h2>
              <p>{driveStatus === 'CONNECTED' && user
                ? 'A ligação está pronta. Podes explorar a cidade e escolher o próximo trabalho com calma.'
                : 'Podes visitar todas as casas. As acções que alteram dados continuam protegidas até ligares a tua conta.'}</p>
              <div className="hero-actions">
                <button onClick={() => setViewMode('CITY')} className="primary-action">
                  Entrar na cidade <ArrowRight className="h-4 w-4"/>
                </button>
                <button onClick={() => setViewMode('LEDGER')} className="secondary-action">
                  <FileCheck2 className="h-4 w-4"/> Ver evidências
                </button>
                <button onClick={() => setViewMode('NURSERY')} className="secondary-action font-mono text-indigo-400 hover:text-indigo-300">
                  <FlaskConical className="h-4 w-4"/> Cognitive Nursery v0.2
                </button>
              </div>
            </div>
            <div className="city-gateway" aria-label="City status">
              <div className="city-gateway__sky"><span/><span/><span/></div>
              <div className="city-gateway__buildings" aria-hidden="true">
                <i/><i/><i/><i/><i/>
              </div>
              <div className="city-gateway__meta">
                <div><Building2 className="h-4 w-4"/><span><strong>{payload.workUnits.length}</strong> casas para explorar</span></div>
                <span className="truth-label">Visita segura</span>
              </div>
            </div>
          </section>

          <section className="decision-grid" aria-label="Current operational decision">
            <article className="decision-card decision-card--next">
              <div className="card-icon card-icon--amber"><ShieldAlert className="h-5 w-5"/></div>
              <div>
                <span className="card-kicker">Próximo passo</span>
                <h3>{driveStatus === 'CONNECTED' && user ? 'Escolher um trabalho' : 'Explorar primeiro a cidade'}</h3>
                <p>{driveStatus === 'CONNECTED' && user
                  ? 'Entra numa casa e confirma o que pode ser feito antes de começar.'
                  : 'Conhece as casas sem alterar nada. A ligação pode ficar para depois.'}</p>
              </div>
              <ChevronRight className="decision-arrow h-5 w-5"/>
            </article>
            <article className="decision-card">
              <div className="card-icon card-icon--cyan"><Activity className="h-5 w-5"/></div>
              <div><span className="card-kicker">Estado da cidade</span><h3>{driveStatus === 'CONNECTED' && user ? 'Ligada e protegida' : 'Tranquila e protegida'}</h3><p>As luzes estão ligadas e todas as casas podem ser visitadas.</p></div>
            </article>
            <article className="decision-card">
              <div className="card-icon card-icon--red"><CircleAlert className="h-5 w-5"/></div>
              <div><span className="card-kicker">Precisa de ti</span><h3>{proposedActions.length ? `${proposedActions.length} pedido${proposedActions.length === 1 ? '' : 's'} por rever` : 'Nada pendente'}</h3><p>{proposedActions.length ? 'Revê antes de autorizar qualquer mudança.' : 'Não tens decisões urgentes neste momento.'}</p></div>
            </article>
          </section>

        <details className="workbench">
          <summary><span><strong>Centro de trabalho</strong><small>Agentes, ligações, tarefas e ferramentas avançadas.</small></span><ChevronRight/></summary>
          <div className="workbench__content">
          {/* Intent Handler */}
        <IntentHandler driveStatus={driveStatus} />

        {/* Console Summary Header */}
        <details className="technical-summary">
          <summary>Canonical system details <span>13 work units · evidence-gated</span></summary>
          <ConsoleSummaryHeader payload={payload} driveStatus={driveStatus} proposedActionCount={proposedActions.length}/>
        </details>

        {/* Phase 0 & Real Drive Payload Ingestion */}
        <CanonicalEntrypointCard 
          entrypoint={canonicalEntrypoint} 
          onIngestSource={handleIngestSource} 
        />

        {/* Global Runtime Status Gate */}
        {driveStatus !== 'CONNECTED' || !user ? (
          <div className="bg-red-950/40 border border-red-900/80 rounded-xl p-4 text-red-200 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="font-bold text-red-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                RUNTIME_STATUS = BLOCKED | AUTONOMY UNAVAILABLE
              </div>
              <div className="text-[11px] text-red-300/80">reason=401 UNAUTHENTICATED: Missing Google OAuth Bearer token in session</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                {isAuthenticating ? 'Connecting...' : 'Connect Google Drive (Sign In)'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-4 text-emerald-200 font-mono text-xs flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                RUNTIME_STATUS = VERIFIED | AUTHENTICATED ({user.email || user.uid})
              </div>
              <div className="text-[11px] text-emerald-300/80">Google Drive OAuth Bearer token active. Micro Worker unblocked.</div>
            </div>
            <button
              onClick={handleUserLogout}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-[11px]"
            >
              Disconnect
            </button>
          </div>
        )}
        
        {/* Phase 1-4 Test Run */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 mb-6 text-zinc-100 flex items-center justify-between shadow-md">
          <div>
             <h3 className="text-sm font-bold font-mono text-emerald-400">REAL AGENTIC RUNTIME LAUNCHER</h3>
             <p className="text-xs text-zinc-400 font-mono mt-1">One verified loop only. No silent execution.</p>
            <p className="mt-2 text-[11px] font-mono text-amber-300" role="status">{runtimeMessage}</p>
          </div>
          <button 
             onClick={handleRunAgentRuntimeTest}
             disabled={driveStatus !== 'CONNECTED' || !user}
             className={`font-mono font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-colors ${
               driveStatus !== 'CONNECTED' || !user 
                 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                 : 'bg-emerald-600 hover:bg-emerald-500 text-white'
             }`}
          >
            {driveStatus !== 'CONNECTED' || !user ? 'BLOCKED — AUTH REQUIRED' : 'Launch Micro Worker'}
          </button>
        </div>

        {/* Drive Adapter Boundary */}
        <DriveAdapterStatus
          driveStatus={driveStatus}
          driveFolder={`operations_console.v0 (Drive ID: ${payload.sourceDriveId})`}
          user={user}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />

        {/* 13 Work Units & Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 13 Work Units List */}
          <div className="lg:col-span-7">
            <WorkUnitList
              workUnits={payload.workUnits}
              selectedUnitId={selectedUnit.id}
              onSelectUnit={(unit) => setSelectedUnit(unit)}
            />
          </div>

          {/* Unit Detail & PROPOSED_ACTION Enforcer */}
          <div className="lg:col-span-5 space-y-6">
            <WorkUnitDetail
              unit={selectedUnit}
              onProposeAction={handleProposeAction}
            />

            {/* Global Owner Security Gates */}
            <OwnerGatesPanel gates={payload.ownerGates} />

            {/* Proposed Actions Queue */}
            <ProposedActionsPanel proposals={proposedActions} />
          </div>
        </div>
          </div>
        </details>
        <nav className="mobile-dock" aria-label="Navegação principal">
          <button onClick={() => setViewMode('CITY')}><Map/><span>Cidade</span></button>
          <button><BriefcaseBusiness/><span>Trabalho</span></button>
          <button onClick={() => setViewMode('LEDGER')}><FileCheck2/><span>Provas</span></button>
          <button><Bell/><span>Avisos</span></button>
          <button><MoreHorizontal/><span>Mais</span></button>
        </nav>
      </main>
      )}
    </div>
  );
}
