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

type Point = { x: number; y: number };

type WorkerVisual = {
  container: Phaser.GameObjects.Container;
  avatar: Phaser.GameObjects.Container;
  aura: Phaser.GameObjects.Arc;
  statusText: Phaser.GameObjects.Text;
  detailText: Phaser.GameObjects.Text;
  leftArm: Phaser.GameObjects.Rectangle;
  rightArm: Phaser.GameObjects.Rectangle;
  leftLeg: Phaser.GameObjects.Rectangle;
  rightLeg: Phaser.GameObjects.Rectangle;
};

type WorkerStage = {
  eventType: string;
  label: string;
  workUnitId?: string;
  replay: boolean;
};

type PendingBuildingTap = {
  pointerId: number;
  startX: number;
  startY: number;
  unit: WorkUnit;
  view: Phaser.GameObjects.Container;
};

const CITY_WORLD = { width: 1920, height: 1280 };
const CITY_WORK_UNIT_SLOTS: Point[] = [
  { x: 318, y: 282 }, { x: 812, y: 282 }, { x: 1108, y: 282 }, { x: 1588, y: 282 },
  { x: 300, y: 570 }, { x: 606, y: 570 }, { x: 1300, y: 570 }, { x: 1612, y: 570 },
  { x: 294, y: 892 }, { x: 612, y: 892 }, { x: 856, y: 892 }, { x: 1094, y: 892 }, { x: 1332, y: 892 }
];

const WORKER_STATIONS: Record<string, Point> = {
  DEPOT: { x: 960, y: 730 },
  CITY_GATE: { x: 960, y: 1120 },
  DRIVE_SOURCE: { x: 430, y: 730 },
  RECEIPT_OFFICE: { x: 1490, y: 730 },
  VERIFY_STATION: { x: 1260, y: 1055 },
  OWNER_GATE: { x: 960, y: 1055 }
};

// Invisible navigation mesh. These rows sit between the three building bands.
// North/south traffic around the civic plaza uses side avenues instead of cutting through it.
const ROAD_ROWS = [430, 730, 1055] as const;
const SIDE_AVENUES = [500, 1450] as const;
const SOUTH_AVENUES = [500, 960, 1450] as const;
const TAP_MOVE_THRESHOLD = 11;
const WORKER_EVENT_TYPES = new Set([
  'ADMITTED', 'CLAIMED', 'WORKING', 'RECEIPT_CREATED', 'READBACK_VERIFIED', 'BLOCKED', 'COMPLETED'
]);

function roadRowForY(y: number): number {
  if (y < 500) return ROAD_ROWS[0];
  if (y < 820) return ROAD_ROWS[1];
  return ROAD_ROWS[2];
}

function roadEntryForSlot(slot: Point): Point {
  return { x: slot.x, y: roadRowForY(slot.y) };
}

function workUnitPoint(workUnitId: string | undefined, workUnits: WorkUnit[]): Point {
  if (!workUnitId) return WORKER_STATIONS.DEPOT;
  const unitIndex = workUnits.findIndex((unit, index) => {
    const anyUnit = unit as any;
    const id = String(anyUnit.work_unit_id ?? anyUnit.WORK_UNIT_ID ?? anyUnit.id ?? `WU-${String(index + 1).padStart(2, '0')}`);
    return id === workUnitId;
  });
  const slot = unitIndex >= 0 && unitIndex < CITY_WORK_UNIT_SLOTS.length ? CITY_WORK_UNIT_SLOTS[unitIndex] : undefined;
  return slot ? roadEntryForSlot(slot) : WORKER_STATIONS.DEPOT;
}

function stationForEvidence(record: RuntimeEvidenceRecord, workUnits: WorkUnit[]): { point: Point; label: string } {
  switch (record.eventType.toUpperCase()) {
    case 'ADMITTED':
      return { point: WORKER_STATIONS.CITY_GATE, label: 'CITY GATE · admission accepted' };
    case 'CLAIMED':
      return { point: workUnitPoint(record.workUnitId, workUnits), label: 'WORK UNIT CURB · task claimed' };
    case 'WORKING':
      return { point: WORKER_STATIONS.DRIVE_SOURCE, label: 'DRIVE SOURCE · reading canonical source' };
    case 'RECEIPT_CREATED':
      return { point: WORKER_STATIONS.RECEIPT_OFFICE, label: 'RECEIPT OFFICE · writing receipt' };
    case 'READBACK_VERIFIED':
      return { point: WORKER_STATIONS.VERIFY_STATION, label: 'VERIFY STATION · readback confirmed' };
    case 'BLOCKED':
      return { point: WORKER_STATIONS.OWNER_GATE, label: 'OWNER GATE · execution blocked' };
    case 'COMPLETED':
    default:
      return { point: WORKER_STATIONS.DEPOT, label: 'DEPOT · completed and available' };
  }
}

function roadPath(from: Point, to: Point): Point[] {
  const points: Point[] = [];
  const push = (point: Point) => {
    const last = points[points.length - 1];
    if (!last || Math.abs(last.x - point.x) > 1 || Math.abs(last.y - point.y) > 1) points.push(point);
  };

  const fromRoadY = roadRowForY(from.y);
  const toRoadY = roadRowForY(to.y);

  if (Math.abs(from.y - fromRoadY) > 10) push({ x: from.x, y: fromRoadY });

  if (fromRoadY === toRoadY) {
    push({ x: to.x, y: toRoadY });
  } else {
    const avenues = fromRoadY === ROAD_ROWS[0] || toRoadY === ROAD_ROWS[0] ? SIDE_AVENUES : SOUTH_AVENUES;
    const avenueX = avenues.reduce((best, candidate) => {
      const bestCost = Math.abs(from.x - best) + Math.abs(to.x - best);
      const candidateCost = Math.abs(from.x - candidate) + Math.abs(to.x - candidate);
      return candidateCost < bestCost ? candidate : best;
    }, avenues[0]);

    push({ x: avenueX, y: fromRoadY });
    push({ x: avenueX, y: toRoadY });
    push({ x: to.x, y: toRoadY });
  }

  if (Math.abs(to.y - toRoadY) > 10) push(to);
  return points;
}

function createWorkerVisual(scene: CityScene): WorkerVisual {
  const shadow = scene.add.ellipse(0, 29, 34, 10, 0x020617, 0.62);
  const aura = scene.add.circle(0, -4, 29, 0x22d3ee, 0.08).setStrokeStyle(2, 0x67e8f9, 0.72);

  const leftLeg = scene.add.rectangle(-5, 10, 6, 22, 0x1e293b, 1).setOrigin(0.5, 0);
  const rightLeg = scene.add.rectangle(5, 10, 6, 22, 0x1e293b, 1).setOrigin(0.5, 0);
  const leftShoe = scene.add.rectangle(-5, 31, 9, 5, 0x020617, 1);
  const rightShoe = scene.add.rectangle(5, 31, 9, 5, 0x020617, 1);

  const torso = scene.add.rectangle(0, -5, 22, 30, 0x2563eb, 1).setStrokeStyle(2, 0xbfdbfe, 0.95);
  const vest = scene.add.rectangle(0, -5, 5, 26, 0xf8fafc, 0.85);
  const leftArm = scene.add.rectangle(-14, -7, 6, 24, 0xd6a77a, 1).setOrigin(0.5, 0.15);
  const rightArm = scene.add.rectangle(14, -7, 6, 24, 0xd6a77a, 1).setOrigin(0.5, 0.15);

  const head = scene.add.circle(0, -29, 11, 0xd6a77a, 1).setStrokeStyle(1, 0x7c5b3e, 0.7);
  const hair = scene.add.arc(0, -32, 10, 180, 360, false, 0x3f2a1f, 1);
  const leftEye = scene.add.circle(-4, -29, 1.4, 0x0f172a, 1);
  const rightEye = scene.add.circle(4, -29, 1.4, 0x0f172a, 1);
  const helmet = scene.add.ellipse(0, -39, 25, 10, 0xfacc15, 1).setStrokeStyle(1, 0x854d0e, 0.9);
  const helmetBrim = scene.add.rectangle(0, -36, 29, 4, 0xeab308, 1);

  const avatar = scene.add.container(0, 0, [
    leftLeg, rightLeg, leftShoe, rightShoe, torso, vest, leftArm, rightArm,
    head, hair, leftEye, rightEye, helmet, helmetBrim
  ]);

  const title = scene.add.text(0, 41, 'MICRO WORKER', {
    fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#f8fafc',
    backgroundColor: '#020617dd', padding: { x: 5, y: 2 }
  }).setOrigin(0.5, 0);

  const statusText = scene.add.text(0, 58, 'AVAILABLE', {
    fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#67e8f9',
    backgroundColor: '#020617dd', padding: { x: 5, y: 2 }
  }).setOrigin(0.5, 0);

  const detailText = scene.add.text(0, 74, 'DEPOT', {
    fontFamily: 'monospace', fontSize: '9px', color: '#cbd5e1',
    backgroundColor: '#020617dd', padding: { x: 5, y: 2 }
  }).setOrigin(0.5, 0);

  const container = scene.add.container(WORKER_STATIONS.DEPOT.x, WORKER_STATIONS.DEPOT.y, [
    shadow, aura, avatar, title, statusText, detailText
  ]).setDepth(5000);

  scene.tweens.add({
    targets: aura,
    alpha: { from: 0.32, to: 0.8 },
    scale: { from: 0.94, to: 1.08 },
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return { container, avatar, aura, statusText, detailText, leftArm, rightArm, leftLeg, rightLeg };
}

function startWalking(scene: CityScene, visual: WorkerVisual, to: Point) {
  scene.tweens.killTweensOf([visual.leftArm, visual.rightArm, visual.leftLeg, visual.rightLeg, visual.avatar]);
  const facing = to.x < visual.container.x ? -1 : 1;
  visual.avatar.setScale(facing, 1);

  visual.leftArm.setAngle(-18);
  visual.rightArm.setAngle(18);
  visual.leftLeg.setAngle(12);
  visual.rightLeg.setAngle(-12);

  scene.tweens.add({
    targets: [visual.leftArm, visual.rightLeg],
    angle: 18,
    duration: 190,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
  scene.tweens.add({
    targets: [visual.rightArm, visual.leftLeg],
    angle: -18,
    duration: 190,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
  scene.tweens.add({
    targets: visual.avatar,
    y: -2,
    duration: 190,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
}

function stopWalking(scene: CityScene, visual: WorkerVisual) {
  scene.tweens.killTweensOf([visual.leftArm, visual.rightArm, visual.leftLeg, visual.rightLeg, visual.avatar]);
  visual.leftArm.setAngle(0);
  visual.rightArm.setAngle(0);
  visual.leftLeg.setAngle(0);
  visual.rightLeg.setAngle(0);
  visual.avatar.setY(0);
}

function applyEvidenceStyle(visual: WorkerVisual, record: RuntimeEvidenceRecord, runtimeConnected: boolean, label: string) {
  const eventType = record.eventType.toUpperCase();
  visual.container.setVisible(true);
  visual.statusText.setText(eventType);
  visual.detailText.setText(`${label} · ${runtimeConnected ? 'LIVE' : 'STORED'}`);

  if (eventType === 'COMPLETED' || eventType === 'READBACK_VERIFIED') {
    visual.aura.setFillStyle(0x10b981, 0.12).setStrokeStyle(2, 0x6ee7b7, 0.92);
    visual.statusText.setColor('#6ee7b7');
  } else if (eventType === 'BLOCKED') {
    visual.aura.setFillStyle(0xef4444, 0.12).setStrokeStyle(2, 0xfca5a5, 0.92);
    visual.statusText.setColor('#fca5a5');
  } else {
    visual.aura.setFillStyle(0x22d3ee, 0.08).setStrokeStyle(2, 0x67e8f9, 0.82);
    visual.statusText.setColor('#67e8f9');
  }
}

function cameraZoomBounds(camera: Phaser.Cameras.Scene2D.Camera) {
  const fit = Math.min(camera.width / CITY_WORLD.width, camera.height / CITY_WORLD.height, 1);
  const min = Math.max(0.14, fit * 0.9);
  return {
    min,
    max: 1.8,
    reset: Phaser.Math.Clamp(fit, min, 1)
  };
}

function segmentDuration(from: Point, to: Point) {
  const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
  return Phaser.Math.Clamp(distance * 1.35, 260, 1200);
}

export const CityVisualizer: React.FC<Props> = ({ workUnits, ownerGates, driveStatus, onSelectUnit }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerVisualRef = useRef<WorkerVisual | null>(null);
  const workerInitializedRef = useRef(false);
  const workerBusyRef = useRef(false);
  const seenEvidenceIdsRef = useRef<Set<string>>(new Set());
  const workerQueueRef = useRef<RuntimeEvidenceRecord[]>([]);
  const cameraInstalledRef = useRef(false);
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const panRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const pinchRef = useRef<{ distance: number; center: Point } | null>(null);
  const gestureMovedRef = useRef(false);
  const pendingBuildingTapRef = useRef<PendingBuildingTap | null>(null);

  const [selected, setSelected] = useState<WorkUnit | null>(null);
  const [runtimeState, setRuntimeState] = useState<Record<string, RuntimeEvent>>({});
  const [runtimeEvidence, setRuntimeEvidence] = useState<RuntimeEvidenceRecord[]>(() => RuntimeEvidenceStore.getSnapshot());
  const [workerStage, setWorkerStage] = useState<WorkerStage | null>(null);

  const workerEvidence = useMemo(
    () => runtimeEvidence.filter(record => record.source === 'agentic-runtime' && WORKER_EVENT_TYPES.has(record.eventType.toUpperCase())),
    [runtimeEvidence]
  );
  const latestWorkerEvidence = workerEvidence[0];
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

  const configureBuildingInteractions = (scene: CityScene) => {
    scene.input.setTopOnly(true);

    scene.buildings.forEach(({ unit, view }) => {
      const hitArea = new Phaser.Geom.Polygon([
        -92, -72,
        -62, -94,
        60, -94,
        94, -70,
        94, 72,
        70, 88,
        -70, 88,
        -94, 70
      ]);
      view.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
      if (view.input) view.input.cursor = 'pointer';

      // Replace the old immediate pointerdown selection. A pan/pinch must never
      // click through the map or select a building under the gesture.
      view.removeAllListeners('pointerdown');
      view.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (activePointersRef.current.size > 1) return;
        pendingBuildingTapRef.current = {
          pointerId: pointer.id,
          startX: pointer.x,
          startY: pointer.y,
          unit,
          view
        };
      });
    });
  };

  const installMobileCamera = (scene: CityScene) => {
    if (cameraInstalledRef.current) return;
    cameraInstalledRef.current = true;

    scene.input.addPointer(2);
    scene.input.removeAllListeners('pointerdown');
    scene.input.removeAllListeners('pointerup');
    scene.input.removeAllListeners('pointermove');
    scene.input.removeAllListeners('wheel');

    const camera = scene.cameras.main;

    const selectPendingBuilding = (pointer: Phaser.Input.Pointer) => {
      const pending = pendingBuildingTapRef.current;
      if (!pending || pending.pointerId !== pointer.id) return;

      const moved = Phaser.Math.Distance.Between(pending.startX, pending.startY, pointer.x, pointer.y);
      pendingBuildingTapRef.current = null;
      if (gestureMovedRef.current || moved > TAP_MOVE_THRESHOLD || pinchRef.current) return;

      const marker = (scene as any).marker as Phaser.GameObjects.Graphics | undefined;
      marker?.clear().lineStyle(4, 0x38bdf8).strokeRoundedRect(
        pending.view.x - 96,
        pending.view.y - 102,
        192,
        210,
        18
      );
      scene.tweens.add({
        targets: pending.view,
        scale: { from: .97, to: 1.035 },
        duration: 170,
        yoyo: true,
        ease: 'Sine.Out'
      });
      EventBus.emit('building-selected', pending.unit);
    };

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      activePointersRef.current.set(pointer.id, { x: pointer.x, y: pointer.y });

      if (activePointersRef.current.size === 1) {
        panRef.current = { pointerId: pointer.id, x: pointer.x, y: pointer.y };
        pinchRef.current = null;
        gestureMovedRef.current = false;
        return;
      }

      pendingBuildingTapRef.current = null;
      gestureMovedRef.current = true;
      const [a, b] = [...activePointersRef.current.values()].slice(0, 2);
      pinchRef.current = {
        distance: Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y),
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      };
      panRef.current = null;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!activePointersRef.current.has(pointer.id)) return;
      activePointersRef.current.set(pointer.id, { x: pointer.x, y: pointer.y });

      if (activePointersRef.current.size >= 2) {
        const [a, b] = [...activePointersRef.current.values()].slice(0, 2);
        const distance = Math.max(1, Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y));
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const previous = pinchRef.current;

        if (previous) {
          const anchorBefore = camera.getWorldPoint(previous.center.x, previous.center.y);
          const limits = cameraZoomBounds(camera);
          camera.setZoom(Phaser.Math.Clamp(camera.zoom * (distance / Math.max(previous.distance, 1)), limits.min, limits.max));
          const anchorAfter = camera.getWorldPoint(center.x, center.y);
          camera.scrollX += anchorBefore.x - anchorAfter.x;
          camera.scrollY += anchorBefore.y - anchorAfter.y;
        }

        pinchRef.current = { distance, center };
        gestureMovedRef.current = true;
        return;
      }

      const pan = panRef.current;
      if (!pan || pan.pointerId !== pointer.id) {
        panRef.current = { pointerId: pointer.id, x: pointer.x, y: pointer.y };
        return;
      }

      const dx = pointer.x - pan.x;
      const dy = pointer.y - pan.y;
      if (Math.hypot(dx, dy) > 1) {
        camera.scrollX -= dx / camera.zoom;
        camera.scrollY -= dy / camera.zoom;
        pan.x = pointer.x;
        pan.y = pointer.y;
        if (Math.hypot(pointer.x - (pendingBuildingTapRef.current?.startX ?? pointer.x), pointer.y - (pendingBuildingTapRef.current?.startY ?? pointer.y)) > TAP_MOVE_THRESHOLD) {
          gestureMovedRef.current = true;
        }
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const wasPinching = activePointersRef.current.size >= 2 || Boolean(pinchRef.current);
      if (!wasPinching) selectPendingBuilding(pointer);
      else pendingBuildingTapRef.current = null;

      activePointersRef.current.delete(pointer.id);

      if (activePointersRef.current.size >= 2) {
        const [a, b] = [...activePointersRef.current.values()].slice(0, 2);
        pinchRef.current = {
          distance: Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y),
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        };
        panRef.current = null;
      } else if (activePointersRef.current.size === 1) {
        const [id, point] = [...activePointersRef.current.entries()][0];
        pinchRef.current = null;
        panRef.current = { pointerId: id, x: point.x, y: point.y };
      } else {
        pinchRef.current = null;
        panRef.current = null;
        gestureMovedRef.current = false;
      }
    });

    scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: any, _dx: number, dy: number) => {
      const limits = cameraZoomBounds(camera);
      camera.setZoom(Phaser.Math.Clamp(camera.zoom - dy * .0008, limits.min, limits.max));
    });
  };

  const configureCityInput = (scene: CityScene) => {
    installMobileCamera(scene);
    configureBuildingInteractions(scene);
  };

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
      workerInitializedRef.current = false;
      workerBusyRef.current = false;
      seenEvidenceIdsRef.current.clear();
      workerQueueRef.current = [];
      cameraInstalledRef.current = false;
      activePointersRef.current.clear();
      panRef.current = null;
      pinchRef.current = null;
      pendingBuildingTapRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('CityScene') as CityScene | undefined;
    if (!scene) return;
    scene.updateData(workUnits, ownerGates);
    configureBuildingInteractions(scene);
  }, [workUnits, ownerGates]);

  useEffect(() => {
    const onCityReady = (scene: CityScene) => configureCityInput(scene);
    EventBus.on('city-ready', onCityReady);

    const scene = gameRef.current?.scene.getScene('CityScene') as CityScene | undefined;
    if (scene?.scene.isActive()) configureCityInput(scene);

    return () => EventBus.off('city-ready', onCityReady);
  }, []);

  useEffect(() => {
    const syncWorker = () => {
      const scene = gameRef.current?.scene.getScene('CityScene') as CityScene | undefined;
      if (!scene || !scene.scene.isActive()) return;

      let visual = workerVisualRef.current;
      if (!visual) {
        visual = createWorkerVisual(scene);
        workerVisualRef.current = visual;
      }

      if (!workerInitializedRef.current) {
        workerInitializedRef.current = true;
        workerEvidence.forEach(record => seenEvidenceIdsRef.current.add(record.id));

        if (!latestWorkerEvidence) {
          visual.container.setVisible(false);
          return;
        }

        const station = stationForEvidence(latestWorkerEvidence, workUnits);
        visual.container.setPosition(station.point.x, station.point.y);
        applyEvidenceStyle(visual, latestWorkerEvidence, runtimeConnected, station.label);
        setWorkerStage({
          eventType: latestWorkerEvidence.eventType.toUpperCase(),
          label: station.label,
          workUnitId: latestWorkerEvidence.workUnitId,
          replay: true
        });
        return;
      }

      const chronological = [...workerEvidence].reverse();
      const unseen = chronological.filter(record => !seenEvidenceIdsRef.current.has(record.id));
      unseen.forEach(record => {
        seenEvidenceIdsRef.current.add(record.id);
        workerQueueRef.current.push(record);
      });

      const runNext = () => {
        if (workerBusyRef.current) return;
        const record = workerQueueRef.current.shift();
        if (!record) return;

        workerBusyRef.current = true;
        const station = stationForEvidence(record, workUnits);
        const from = { x: visual!.container.x, y: visual!.container.y };
        const path = roadPath(from, station.point);
        const eventType = record.eventType.toUpperCase();

        applyEvidenceStyle(visual!, record, runtimeConnected, station.label);
        setWorkerStage({
          eventType,
          label: station.label,
          workUnitId: record.workUnitId,
          replay: false
        });

        let index = 0;
        const walkSegment = () => {
          const point = path[index++];
          if (!point) {
            stopWalking(scene, visual!);
            workerBusyRef.current = false;
            runNext();
            return;
          }

          const current = { x: visual!.container.x, y: visual!.container.y };
          startWalking(scene, visual!, point);
          scene.tweens.add({
            targets: visual!.container,
            x: point.x,
            y: point.y,
            duration: segmentDuration(current, point),
            ease: 'Sine.InOut',
            onComplete: walkSegment
          });
        };

        if (path.length === 0) {
          workerBusyRef.current = false;
          runNext();
        } else {
          walkSegment();
        }
      };

      if (!latestWorkerEvidence && workerQueueRef.current.length === 0) {
        visual.container.setVisible(false);
      } else {
        runNext();
      }
    };

    syncWorker();
    EventBus.on('city-ready', syncWorker);
    return () => EventBus.off('city-ready', syncWorker);
  }, [workerEvidence, latestWorkerEvidence, runtimeConnected, workUnits]);

  const camera = () => (gameRef.current?.scene.getScene('CityScene') as CityScene | undefined)?.cameras.main;
  const zoom = (delta: number) => {
    const c = camera();
    if (!c) return;
    const limits = cameraZoomBounds(c);
    const anchor = c.getWorldPoint(c.width / 2, c.height / 2);
    c.setZoom(Phaser.Math.Clamp(c.zoom + delta, limits.min, limits.max));
    const after = c.getWorldPoint(c.width / 2, c.height / 2);
    c.scrollX += anchor.x - after.x;
    c.scrollY += anchor.y - after.y;
  };
  const reset = () => {
    const c = camera();
    if (!c) return;
    const limits = cameraZoomBounds(c);
    c.centerOn(CITY_WORLD.width / 2, CITY_WORLD.height / 2);
    c.setZoom(limits.reset);
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
      <header className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-950/95 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[.18em] text-sky-300 sm:text-xs">
            <Map size={15}/> OPERATIONAL CITY
          </div>
          {runtimeConnected ? (
            <>
              <h2 className="mt-1 text-base font-black sm:text-xl">LIVE WORKER CITY</h2>
              <p className="hidden max-w-2xl text-xs text-slate-400 sm:block sm:text-sm">
                The worker walks only when persisted runtime evidence advances. Movement never invents process progress.
              </p>
            </>
          ) : latestWorkerEvidence ? (
            <>
              <h2 className="mt-1 text-base font-black sm:text-xl">VERIFIED RUNTIME SNAPSHOT</h2>
              <p className="hidden max-w-2xl text-xs text-slate-400 sm:block sm:text-sm">
                Last verified position remains visible. New operational movement stays blocked until Drive reconnects.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-1 text-base font-black sm:text-xl">STATIC CANONICAL MAP</h2>
              <p className="hidden max-w-2xl text-xs text-slate-400 sm:block sm:text-sm">
                No authenticated runtime and no verified Worker evidence is available yet.
              </p>
            </>
          )}
        </div>
        {runtimeConnected ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-2.5 py-1.5 text-[10px] font-black text-emerald-200 sm:px-3 sm:py-2 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400"/> RUNTIME ACTIVE
          </div>
        ) : latestWorkerEvidence ? (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/60 px-2.5 py-1.5 text-[10px] font-black text-amber-200 sm:px-3 sm:py-2 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-amber-400"/> EVIDENCE SNAPSHOT · EXECUTION BLOCKED
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/60 px-2.5 py-1.5 text-[10px] font-black text-red-200 sm:px-3 sm:py-2 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-red-400"/> BLOCKED · AUTONOMY UNAVAILABLE (401 UNAUTHENTICATED)
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0 touch-none" aria-label="Canonical operational city map"/>

        {workerStage && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(70vw,390px)] rounded-xl border border-cyan-500/40 bg-slate-950/92 px-3 py-2 shadow-xl backdrop-blur">
            <div className="text-[10px] font-black tracking-[.16em] text-cyan-300">
              MICRO WORKER · {workerStage.replay ? 'LAST VERIFIED POSITION' : 'ROAD-MESH WALK'}
            </div>
            <div className="mt-1 font-mono text-xs font-bold text-slate-100">
              {workerStage.eventType}{workerStage.workUnitId ? ` · ${workerStage.workUnitId}` : ''}
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">{workerStage.label}</div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-xl border border-slate-700 bg-slate-950/88 px-3 py-2 text-[10px] text-slate-400 shadow-lg sm:block">
          <div className="font-black tracking-[.14em] text-slate-300">REAL PROCESS ROUTE · ROAD MESH</div>
          <div className="mt-1 font-mono">GATE → WORK UNIT CURB → DRIVE SOURCE → RECEIPT → VERIFY → DEPOT</div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-slate-700/70 bg-slate-950/78 px-2 py-1 text-[9px] font-bold tracking-[.12em] text-slate-300 shadow sm:hidden">
          1 FINGER MOVE · 2 FINGERS ZOOM
        </div>

        <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-xl border border-slate-600 bg-slate-950/90 shadow-xl">
          <button onClick={() => zoom(.12)} className="p-2.5 text-slate-200 hover:bg-slate-800 sm:p-3" aria-label="Zoom in"><ZoomIn size={18}/></button>
          <button onClick={() => zoom(-.12)} className="border-x border-slate-700 p-2.5 text-slate-200 hover:bg-slate-800 sm:p-3" aria-label="Zoom out"><ZoomOut size={18}/></button>
          <button onClick={reset} className="p-2.5 text-slate-200 hover:bg-slate-800 sm:p-3" aria-label="Reset map"><RefreshCw size={18}/></button>
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
