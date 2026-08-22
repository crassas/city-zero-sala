import React from 'react';
import { Network, ShieldCheck, Circle } from 'lucide-react';

interface HeaderProps { connected?: boolean; }

export const Header: React.FC<HeaderProps> = ({ connected = false }) => (
  <header id="console-top-header" className="premium-header">
    <div className="flex items-center gap-3">
      <div className="brand-mark"><Network className="h-5 w-5"/></div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-white">Graph Engineer</h1>
          <span className="version-chip">Cidade · 01</span>
          <span className={`state-chip ${connected ? 'state-chip--ready' : 'state-chip--blocked'}`}>
            <Circle className="h-2 w-2 fill-current"/>{connected ? 'Ligada' : 'Protegida'}
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
