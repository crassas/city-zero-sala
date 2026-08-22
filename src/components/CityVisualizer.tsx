import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { CityScene } from '../game/CityScene';
import { EventBus } from '../game/EventBus';
import { WorkUnit, RuntimeEvent, OwnerGateItem } from '../types';
import { Map, RefreshCw, X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  workUnits: WorkUnit[];
  ownerGates: OwnerGateItem[];
  driveStatus?: string;
  onSelectUnit: (unit: WorkUnit) => void;
}

export const CityVisualizer: React.FC<Props> = ({ workUnits, ownerGates, driveStatus, onSelectUnit }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<WorkUnit | null>(null);
  const [runtimeState, setRuntimeState] = useState<Record<string, RuntimeEvent>>({});

  useEffect(() => {
    const onRuntime = (event: RuntimeEvent) => {
      const anyEvent = event as any;
      const id = String(anyEvent.work_unit_id ?? anyEvent.ticket?.WORK_UNIT_ID ?? '');
      if (id) setRuntimeState(prev => ({ ...prev, [id]: event }));
    };
    const onBuilding = (unit: WorkUnit) => {
      setSelected(unit);
      onSelectUnit(unit);
    };
    EventBus.on('runtime-event', onRuntime);
    EventBus.on('building-selected', onBuilding);
    return () => {
      EventBus.off('runtime-event', onRuntime);
      EventBus.off('building-selected', onBuilding);
    };
  }, [onSelectUnit]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: containerRef.current.clientWidth || 960,
      height: containerRef.current.clientHeight || 640,
      parent: containerRef.current,
      backgroundColor: '#0b1220',
      physics: { default: 'arcade', arcade: { debug: false } },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [CityScene]
    });
    gameRef.current.scene.start('CityScene', { workUnits, ownerGates });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('CityScene') as CityScene | undefined;
    scene?.updateData(workUnits, ownerGates);
  }, [workUnits, ownerGates]);

  const camera = () => (gameRef.current?.scene.getScene('CityScene') as CityScene | undefined)?.cameras.main;
  const zoom = (delta: number) => {
    const c = camera();
    if (c) c.setZoom(Phaser.Math.Clamp(c.zoom + delta, .42, 1.5));
  };
  const reset = () => {
    const c = camera();
    if (c) { c.centerOn(960, 640); c.setZoom(Math.min(c.width / 1120, c.height / 760, 1)); }
  };

  const value = (u: WorkUnit | null, ...keys: string[]) => {
    if (!u) return 'NOT VERIFIED';
    for (const k of keys) {
      const v = (u as any)[k];
      if (v !== undefined && v !== null && String(v).trim()) return String(v);
    }
    return 'NOT VERIFIED';
  };
  const selectedId = value(selected, 'work_unit_id', 'WORK_UNIT_ID', 'id');
  const latest = selectedId !== 'NOT VERIFIED' ? runtimeState[selectedId] : undefined;

  return (
    <section className="relative flex h-[calc(100dvh-72px)] min-h-[560px] w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-950/95 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[.18em] text-sky-300">
            <Map size={15}/> OPERATIONAL CITY
          </div>
          {driveStatus === 'CONNECTED' ? (
            <>
              <h2 className="mt-1 text-lg font-black sm:text-xl">ACTIVE AUTONOMOUS CITY VISUALIZER</h2>
              <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
                Agents move autonomously based on canonical workload.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-1 text-lg font-black sm:text-xl">STATIC CANONICAL MAP</h2>
              <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
                Decorative town only. No authenticated runtime, claims or autonomous movement.
              </p>
            </>
          )}
        </div>
        {driveStatus === 'CONNECTED' ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-3 py-2 text-xs font-black text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400"/> RUNTIME ACTIVE
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/60 px-3 py-2 text-xs font-black text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400"/> BLOCKED · AUTONOMY UNAVAILABLE (401 UNAUTHENTICATED)
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0 touch-none" aria-label="Canonical operational city map"/>
        <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-xl border border-slate-600 bg-slate-950/90 shadow-xl">
          <button onClick={() => zoom(.12)} className="p-3 text-slate-200 hover:bg-slate-800" aria-label="Zoom in"><ZoomIn size={18}/></button>
          <button onClick={() => zoom(-.12)} className="border-x border-slate-700 p-3 text-slate-200 hover:bg-slate-800" aria-label="Zoom out"><ZoomOut size={18}/></button>
          <button onClick={reset} className="p-3 text-slate-200 hover:bg-slate-800" aria-label="Reset map"><RefreshCw size={18}/></button>
        </div>

        <aside className={`absolute inset-x-2 bottom-2 z-30 max-h-[48dvh] overflow-auto rounded-2xl border border-slate-600 bg-slate-950/95 p-4 shadow-2xl backdrop-blur transition sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[360px] ${selected ? '' : 'translate-y-[120%]'}`}>
          <button onClick={() => setSelected(null)} className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800" aria-label="Close inspector"><X size={18}/></button>
          <div className="pr-10 text-xs font-bold tracking-[.16em] text-sky-300">BUILDING INSPECTOR</div>
          <h3 className="mt-2 break-words text-lg font-black">{selectedId}</h3>
          <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-x-3 gap-y-3 text-xs">
            {[
              ['SOURCE FILE', value(selected,'source_file_id','SOURCE_FILE_ID')],
              ['SOURCE STATUS', value(selected,'source_status','SOURCE_STATUS','status','STATUS')],
              ['SOURCE QUALITY', value(selected,'source_quality','SOURCE_QUALITY')],
              ['ACTIVE CLAIM', value(selected,'active_claim','ACTIVE_CLAIM')],
              ['ACTOR ID', String((latest as any)?.actor_id ?? 'NOT VERIFIED')],
              ['LATEST EVENT', String((latest as any)?.event_id ?? (latest as any)?.event_type ?? 'NOT VERIFIED')],
              ['EVIDENCE IDS', value(selected,'evidence_ids','EVIDENCE_IDS')],
              ['RECEIPT ID', value(selected,'receipt_id','RECEIPT_ID')],
              ['READBACK', value(selected,'readback_verified','READBACK_VERIFIED')]
            ].map(([k,v]) => <React.Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="break-words text-right font-mono text-slate-200">{v}</dd></React.Fragment>)}
          </dl>
        </aside>
      </div>
    </section>
  );
};
