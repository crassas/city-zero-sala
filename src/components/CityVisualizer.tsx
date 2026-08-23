import React, { useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import { CityScene } from '../game/CityScene';
import { EventBus } from '../game/EventBus';
import { WorkUnit, RuntimeEvent, OwnerGateItem } from '../types';
import { RuntimeEvidenceRecord, RuntimeEvidenceStore } from '../runtime/runtimeEvidenceStore';
import { Map, RefreshCw, X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  workUnits: WorkUnit[];
  ownerGates: OwnerGateItem[];
  driveStatus?: string;
  onSelectUnit: (unit: WorkUnit) => void;
}

type WorkerVisual = {
  container: Phaser.GameObjects.Container;
  aura: Phaser.GameObjects.Arc;
  statusText: Phaser.GameObjects.Text;
  detailText: Phaser.GameObjects.Text;
};

const CITY_WORK_UNIT_SLOTS = [
  { x: 318, y: 282 }, { x: 812, y: 282 }, { x: 1108, y: 282 }, { x: 1588, y: 282 },
  { x: 300, y: 570 }, { x: 606, y: 570 }, { x: 1300, y: 570 }, { x: 1612, y: 570 },
  { x: 294, y: 892 }, { x: 612, y: 892 }, { x: 856, y: 892 }, { x: 1094, y: 892 }, { x: 1332, y: 892 }
];

// Keep the completed worker in the visible centre of the city so a persisted
// runtime result remains inspectable even after the live Drive session expires.
const WORKER_DEPOT = { x: 960, y: 730 };
const WORKER_EVENT_TYPES = new Set([
  'ADMITTED', 'CLAIMED', 'WORKING', 'RECEIPT_CREATED', 'READBACK_VERIFIED', 'BLOCKED', 'COMPLETED'
]);

export const CityVisualizer: React.FC<Props> = ({ workUnits, ownerGates, driveStatus, onSelectUnit }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerVisualRef = useRef<WorkerVisual | null>(null);
  const lastWorkerEventIdRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<WorkUnit | null>(null);
  const [runtimeState, setRuntimeState] = useState<Record<string, RuntimeEvent>>({});
  const [runtimeEvidence, setRuntimeEvidence] = useState<RuntimeEvidenceRecord[]>(() => RuntimeEvidenceStore.getSnapshot());

  const latestWorkerEvidence = useMemo(
    () => runtimeEvidence.find(record => record.source === 'agentic-runtime' && WORKER_EVENT_TYPES.has(record.eventType.toUpperCase())),
    [runtimeEvidence]
  );
  const runtimeConnected = driveStatus === 'CONNECTED';

  useEffect(() => RuntimeEvidenceStore.subscribe(setRuntimeEvidence), []);

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
      workerVisualRef.current = null;
      lastWorkerEventIdRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('CityScene') as CityScene | undefined;
    scene?.updateData(workUnits, ownerGates);
  }, [workUnits, ownerGates]);

  useEffect(() => {
    const syncWorker = () => {
      const scene = gameRef.current?.scene.getScene('CityScene') as CityScene | undefined;
      if (!scene || !scene.scene.isActive()) return;

      // Visibility is evidence-gated, not auth-gated. Losing the live OAuth
      // session must block execution, but must not erase already verified work.
      if (!latestWorkerEvidence) {
        workerVisualRef.current?.container.setVisible(false);
        return;
      }

      let visual = workerVisualRef.current;
      if (!visual) {
        const shadow = scene.add.ellipse(0, 23, 48, 16, 0x020617, 0.72);
        const aura = scene.add.circle(0, 0, 31, 0x22d3ee, 0.12).setStrokeStyle(2, 0x67e8f9, 0.92);
        const body = scene.add.rectangle(0, 5, 28, 30, 0x0f172a, 1).setStrokeStyle(2, 0xe2e8f0, 0.95);
        const head = scene.add.rectangle(0, -17, 34, 24, 0x1e293b, 1).setStrokeStyle(2, 0x67e8f9, 1);
        const eyeLeft = scene.add.circle(-7, -18, 3, 0x67e8f9, 1);
        const eyeRight = scene.add.circle(7, -18, 3, 0x67e8f9, 1);
        const antenna = scene.add.rectangle(0, -34, 3, 10, 0x94a3b8, 1);
        const antennaTip = scene.add.circle(0, -40, 4, 0x22d3ee, 1);
        const title = scene.add.text(0, 38, 'MICRO WORKER', {
          fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#e2e8f0',
          backgroundColor: '#020617cc', padding: { x: 6, y: 3 }
        }).setOrigin(0.5, 0);
        const statusText = scene.add.text(0, 60, '', {
          fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#67e8f9',
          backgroundColor: '#020617dd', padding: { x: 5, y: 2 }
        }).setOrigin(0.5, 0);
        const detailText = scene.add.text(0, 79, '', {
          fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8',
          backgroundColor: '#020617dd', padding: { x: 5, y: 2 }
        }).setOrigin(0.5, 0);

        const worker = scene.add.container(WORKER_DEPOT.x, WORKER_DEPOT.y, [
          shadow, aura, body, head, eyeLeft, eyeRight, antenna, antennaTip, title, statusText, detailText
        ]).setDepth(5000);

        scene.tweens.add({
          targets: aura,
          alpha: { from: 0.45, to: 1 },
          scale: { from: 0.92, to: 1.12 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        });

        visual = { container: worker, aura, statusText, detailText };
        workerVisualRef.current = visual;
      }

      const eventType = latestWorkerEvidence.eventType.toUpperCase();
      const workUnitId = latestWorkerEvidence.workUnitId;
      const unitIndex = workUnits.findIndex((unit, index) => {
        const anyUnit = unit as any;
        const id = String(anyUnit.work_unit_id ?? anyUnit.WORK_UNIT_ID ?? anyUnit.id ?? `WU-${String(index + 1).padStart(2, '0')}`);
        return workUnitId ? id === workUnitId : false;
      });
      const target = unitIndex >= 0 ? CITY_WORK_UNIT_SLOTS[unitIndex] : undefined;
      const targetEvents = new Set(['WORKING', 'RECEIPT_CREATED', 'READBACK_VERIFIED', 'BLOCKED']);
      const destination = targetEvents.has(eventType) && target ? target : WORKER_DEPOT;

      visual.container.setVisible(true);
      visual.statusText.setText(eventType);
      visual.detailText.setText(
        `${workUnitId ?? 'RUNTIME'} · ${runtimeConnected ? 'LIVE EVIDENCE' : 'STORED EVIDENCE'}`
      );

      if (eventType === 'COMPLETED' || eventType === 'READBACK_VERIFIED') {
        visual.aura.setFillStyle(0x10b981, 0.16).setStrokeStyle(2, 0x6ee7b7, 0.95);
        visual.statusText.setColor('#6ee7b7');
      } else if (eventType === 'BLOCKED') {
        visual.aura.setFillStyle(0xef4444, 0.16).setStrokeStyle(2, 0xfca5a5, 0.95);
        visual.statusText.setColor('#fca5a5');
      } else {
        visual.aura.setFillStyle(0x22d3ee, 0.12).setStrokeStyle(2, 0x67e8f9, 0.92);
        visual.statusText.setColor('#67e8f9');
      }

      const isNewEvent = lastWorkerEventIdRef.current !== latestWorkerEvidence.id;
      if (lastWorkerEventIdRef.current === null) {
        // Persisted history initializes directly at the verified position. It
        // never replays movement that did not occur during this city session.
        visual.container.setPosition(destination.x, destination.y);
      } else if (isNewEvent) {
        scene.tweens.killTweensOf(visual.container);
        scene.tweens.add({
          targets: visual.container,
          x: destination.x,
          y: destination.y,
          duration: 950,
          ease: 'Sine.InOut'
        });
      } else if (Math.abs(visual.container.x - destination.x) > 2 || Math.abs(visual.container.y - destination.y) > 2) {
        visual.container.setPosition(destination.x, destination.y);
      }

      lastWorkerEventIdRef.current = latestWorkerEvidence.id;
    };

    syncWorker();
    EventBus.on('city-ready', syncWorker);
    return () => EventBus.off('city-ready', syncWorker);
  }, [latestWorkerEvidence, runtimeConnected, workUnits]);

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
          {runtimeConnected ? (
            <>
              <h2 className="mt-1 text-lg font-black sm:text-xl">ACTIVE AUTONOMOUS CITY VISUALIZER</h2>
              <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
                Worker position is projected only from persisted runtime evidence; no synthetic activity is displayed.
              </p>
            </>
          ) : latestWorkerEvidence ? (
            <>
              <h2 className="mt-1 text-lg font-black sm:text-xl">VERIFIED RUNTIME SNAPSHOT</h2>
              <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
                Last verified Worker state remains visible from persistent evidence. New execution stays blocked until Drive reconnects.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-1 text-lg font-black sm:text-xl">STATIC CANONICAL MAP</h2>
              <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
                No authenticated runtime and no verified Worker evidence is available yet.
              </p>
            </>
          )}
        </div>
        {runtimeConnected ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-3 py-2 text-xs font-black text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400"/> RUNTIME ACTIVE
          </div>
        ) : latestWorkerEvidence ? (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/60 px-3 py-2 text-xs font-black text-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-400"/> EVIDENCE SNAPSHOT · EXECUTION BLOCKED
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/60 px-3 py-2 text-xs font-black text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400"/> BLOCKED · AUTONOMY UNAVAILABLE (401 UNAUTHENTICATED)
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0 touch-none" aria-label="Canonical operational city map"/>
        {latestWorkerEvidence && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(72vw,340px)] rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3 py-2 shadow-xl backdrop-blur">
            <div className="text-[10px] font-black tracking-[.16em] text-cyan-300">
              MICRO WORKER · {runtimeConnected ? 'VERIFIED RUNTIME' : 'LAST VERIFIED STATE'}
            </div>
            <div className="mt-1 font-mono text-xs font-bold text-slate-100">
              {latestWorkerEvidence.eventType.toUpperCase()}{latestWorkerEvidence.workUnitId ? ` · ${latestWorkerEvidence.workUnitId}` : ''}
            </div>
            <div className="mt-1 truncate font-mono text-[10px] text-slate-400">
              {latestWorkerEvidence.actorId ?? 'Agentic_Runtime_V1'} · {new Date(latestWorkerEvidence.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
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
