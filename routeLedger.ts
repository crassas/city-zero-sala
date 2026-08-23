import { z } from 'zod';

export const RoutePhaseSchema = z.enum([
  'PLANNED', 'IN_TRANSIT', 'ARRIVED', 'WORKING', 'WORK_COMPLETED',
  'RETURN_PLANNED', 'STOPPED', 'RETURNING', 'ARRIVAL_VERIFIED',
  'HANDOFF_DELIVERED', 'SHIFT_CLOSED', 'BLOCKED'
]);

export const OperationalStopSchema = z.object({
  stopId: z.string(),
  address: z.string(),
  reason: z.string(),
  authorityScope: z.string(),
  startedAt: z.string(),
  expectedResumeAt: z.string().optional(),
  completedAt: z.string().optional(),
  evidenceRefs: z.array(z.string()).default([])
});

export const RouteLedgerEntrySchema = z.object({
  routeId: z.string(),
  missionId: z.string(),
  actorId: z.string(),
  homeAddress: z.string(),
  origin: z.string(),
  plannedPath: z.array(z.string()).min(1),
  actualPath: z.array(z.string()).default([]),
  currentAddress: z.string(),
  finalDestination: z.string(),
  returnTo: z.string(),
  phase: RoutePhaseSchema,
  activeStop: OperationalStopSchema.optional(),
  deviations: z.array(z.object({
    at: z.string(),
    plannedAddress: z.string(),
    actualAddress: z.string(),
    reason: z.string(),
    authorized: z.boolean()
  })).default([]),
  evidenceRefs: z.array(z.string()).default([]),
  arrivalVerified: z.boolean().default(false),
  handoffDelivered: z.boolean().default(false),
  toolsReturned: z.boolean().default(false),
  receiptId: z.string().optional()
});

export type RouteLedgerEntry = z.infer<typeof RouteLedgerEntrySchema>;
export type OperationalStop = z.infer<typeof OperationalStopSchema>;

export function canCloseShift(route: RouteLedgerEntry): boolean {
  return route.currentAddress === route.homeAddress
    && route.arrivalVerified
    && route.handoffDelivered
    && route.toolsReturned
    && Boolean(route.receiptId);
}

export function declareStop(route: RouteLedgerEntry, stop: OperationalStop): RouteLedgerEntry {
  if (route.phase !== 'RETURNING' && route.phase !== 'RETURN_PLANNED') {
    throw new Error('STOP_REJECTED: no active return route');
  }
  return RouteLedgerEntrySchema.parse({
    ...route,
    phase: 'STOPPED',
    currentAddress: stop.address,
    activeStop: stop,
    actualPath: [...route.actualPath, stop.address]
  });
}

export function resumeReturn(route: RouteLedgerEntry, completedAt: string): RouteLedgerEntry {
  if (route.phase !== 'STOPPED' || !route.activeStop) {
    throw new Error('RETURN_REJECTED: no declared stop to complete');
  }
  return RouteLedgerEntrySchema.parse({
    ...route,
    phase: 'RETURNING',
    activeStop: undefined,
    evidenceRefs: [...route.evidenceRefs, ...route.activeStop.evidenceRefs],
    actualPath: [...route.actualPath, `RESUMED:${completedAt}`]
  });
}

export function closeShift(route: RouteLedgerEntry): RouteLedgerEntry {
  if (!canCloseShift(route)) {
    throw new Error('SHIFT_CLOSE_REJECTED: return, handoff, tools or receipt not verified');
  }
  return RouteLedgerEntrySchema.parse({ ...route, phase: 'SHIFT_CLOSED' });
}
