import { getAccessToken } from '../lib/firebaseAuth';
import { fetchDriveFile } from '../lib/driveService';

export type ReadOnlyCapabilityState = 'VERIFIED' | 'BLOCKED';

export interface ReadOnlyCapabilityProbeResult {
  DRIVE_AUTH: ReadOnlyCapabilityState;
  DRIVE_READ: ReadOnlyCapabilityState;
  checkedAt: string;
  targetDriveId: string;
  fileName?: string;
  error?: string;
}

/**
 * Read-only capability check.
 *
 * This function never creates, updates, or deletes a Drive file. It only
 * checks for an active OAuth token and attempts to read the requested file.
 */
export async function runReadOnlyCapabilityProbe(
  targetDriveId: string
): Promise<ReadOnlyCapabilityProbeResult> {
  const checkedAt = new Date().toISOString();
  const token = await getAccessToken();

  if (!token) {
    return {
      DRIVE_AUTH: 'BLOCKED',
      DRIVE_READ: 'BLOCKED',
      checkedAt,
      targetDriveId,
      error: '401 UNAUTHENTICATED: Missing Google OAuth Bearer token in session'
    };
  }

  const readResult = await fetchDriveFile(targetDriveId);
  if (!readResult.success) {
    return {
      DRIVE_AUTH: 'VERIFIED',
      DRIVE_READ: 'BLOCKED',
      checkedAt,
      targetDriveId,
      error: readResult.error || 'Drive read failed'
    };
  }

  return {
    DRIVE_AUTH: 'VERIFIED',
    DRIVE_READ: 'VERIFIED',
    checkedAt,
    targetDriveId,
    fileName: readResult.name
  };
}
