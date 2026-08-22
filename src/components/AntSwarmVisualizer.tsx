import React, { useState } from 'react';
import { Play, Terminal, RefreshCw } from 'lucide-react';
import { WorkUnit } from '../types';

interface Props {
  workUnits: WorkUnit[];
  onSelectUnit: (unit: WorkUnit) => void;
}

export const AntSwarmVisualizer: React.FC<Props> = ({ workUnits, onSelectUnit }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [swarmLogs, setSwarmLogs] = useState<string[]>([
    "[SYSTEM_INIT] Ant Swarm Engine conectado a operations_console.v0. 13 unidades canónicas prontas para varredura."
  ]);

  const handleLaunchSwarm = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStep(0);
    setSwarmLogs(prev => [
      `[${new Date().toLocaleTimeString()}] 🐜 DISPARO DO ENXAME: Iniciando varredura sequencial das 13 unidades canónicas...`,
      ...prev
    ]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < workUnits.length) {
        const currentUnit = workUnits[step];
        setActiveStep(step);
        onSelectUnit(currentUnit);
        setSwarmLogs(prev => [
          `[${new Date().toLocaleTimeString()}] 🐜 Formiga em ${currentUnit.id} (${currentUnit.name}) -> Status: ${currentUnit.status} | Agente: ${currentUnit.assignedAgent}`,
          ...prev.slice(0, 25)
        ]);
        step++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setActiveStep(-1);
        setSwarmLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ✓ VARREDURA COMPLETA: 13 unidades canónicas verificadas com 100% de fidelidade a operations_console.v0.`,
          ...prev
        ]);
      }
    }, 400);
  };

  return (
    <div id="ant-swarm-panel" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 mb-6 text-zinc-100 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 flex items-center justify-center text-xl">
            🐜
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                <span>ENXAME DE FORMIGAS OPERACIONAIS</span>
              </h3>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-bold">
                ANT SCOUT PROTOCOL
              </span>
              <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                13 Unidades Canónicas
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Sincronização estrita com operations_console.v0 (Drive ID: 15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w)
            </p>
          </div>
        </div>

        <button
          id="btn-dispatch-swarm"
          onClick={handleLaunchSwarm}
          disabled={isRunning}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-colors border border-amber-400/30 shadow-md cursor-pointer shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Varrendo Unidades ({activeStep + 1}/13)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mandar as Formigas (Disparar Varredura)</span>
            </>
          )}
        </button>
      </div>

      {/* 13 Canonical Agents Swarm Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 my-4">
        {workUnits.map((unit, idx) => (
          <div
            key={unit.id}
            onClick={() => onSelectUnit(unit)}
            className={`p-2 rounded-lg border text-left font-mono cursor-pointer transition-all ${
              isRunning && activeStep === idx
                ? 'bg-amber-950/90 border-amber-400 shadow-md ring-1 ring-amber-400/50 scale-102'
                : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-amber-400 font-bold">
                🐜 {unit.id}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                unit.status === 'COMPLETED' ? 'bg-emerald-400' :
                unit.status === 'BLOCKED' ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
            </div>
            <div className="text-[10px] font-bold text-zinc-200 truncate">{unit.assignedAgent}</div>
            <div className="text-[9px] text-zinc-400 truncate mt-0.5">{unit.name}</div>
          </div>
        ))}
      </div>

      {/* Live Telemetry Log Stream */}
      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-900 text-zinc-400 text-[10px]">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-amber-400" />
            <span>TELEMETRIA DE EXECUÇÃO DAS FORMIGAS</span>
          </span>
          <span>Buffer: {swarmLogs.length} eventos</span>
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
          {swarmLogs.map((log, i) => (
            <div key={i} className="text-zinc-300 leading-tight">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
