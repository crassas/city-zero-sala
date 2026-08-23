import React, { useEffect, useState } from 'react';
import { Network, ShieldCheck, Circle } from 'lucide-react';
import { checkSocietyHealth, SocietyBackendStatus } from '../lib/societyApi';

interface HeaderProps { connected?: boolean; }

function backendLabel(status: SocietyBackendStatus): string {
  switch (status) {
    case 'CONNECTED': return 'Society ligada';
    case 'CHECKING': return 'Society a verificar';
    case 'UNCONFIGURED': return 'Society por configurar';
    case 'UNREACHABLE': return 'Society indisponível';
  }
}

export const Header: React.FC<HeaderProps> = ({ connected = false }) => {
  const [backendStatus, setBackendStatus] = useState<SocietyBackendStatus>('CHECKING');

  useEffect(() => {
    let active = true;

    const probe = async () => {
      if (!active) return;
      setBackendStatus('CHECKING');
      const result = await checkSocietyHealth();
      if (active) setBackendStatus(result.status);
    };

    void probe();
    const interval = window.setInterval(() => void probe(), 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <header id="console-top-header" className="premium-header">
      <div className="flex items-center gap-3">
        <div className="brand-mark"><Network className="h-5 w-5"/></div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-white">Graph Engineer</h1>
            <span className="version-chip">Cidade · 01</span>
            <span className={`state-chip ${connected ? 'state-chip--ready' : 'state-chip--blocked'}`}>
              <Circle className="h-2 w-2 fill-current"/>{connected ? 'Drive ligada' : 'Drive protegida'}
            </span>
            <span className={`state-chip ${backendStatus === 'CONNECTED' ? 'state-chip--ready' : 'state-chip--blocked'}`}>
              <Circle className="h-2 w-2 fill-current"/>{backendLabel(backendStatus)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Uma cidade para organizar trabalho com segurança</p>
        </div>
      </div>
      <div className="hidden items-center gap-2 text-[11px] text-slate-400 md:flex">
        <ShieldCheck className="h-4 w-4 text-emerald-400"/>
        <span>Protecções activas</span>
      </div>
    </header>
  );
};
