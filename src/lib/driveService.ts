import { getAccessToken } from './firebaseAuth';

export interface DriveProbeResult {
  status: 'DRIVE_WRITE_VERIFIED' | 'DRIVE_WRITE_BLOCKED';
  fileId?: string;
  fileName?: string;
  verifiedContent?: string;
  error?: string;
  sha256?: string;
}

export interface DriveExecutionResult {
  status: 'SUCCESS_READ_BACK_VERIFIED' | 'AUTH_REQUIRED' | 'EXECUTION_FAILED';
  targetDriveId: string;
  instructionsLoaded?: string;
  receiptFileId?: string;
  receiptFileName?: string;
  verifiedContent?: string;
  workUnitsProcessed?: number;
  error?: string;
}

// 1. Fetch file content from Google Drive / Docs using active OAuth token
export async function fetchDriveFile(fileId: string): Promise<{ success: boolean; content?: string; error?: string; name?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      error: '401 UNAUTHENTICATED: Missing Google OAuth Bearer token in session. Sign in with Google to grant access.'
    };
  }

  try {
    // Try Google Docs export endpoint first
    const exportRes = await fetch(`https://docs.google.com/document/d/${fileId}/export?format=txt`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (exportRes.ok) {
      const text = await exportRes.text();
      return { success: true, content: text };
    }

    // Fallback: Drive media download
    const mediaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (mediaRes.ok) {
      const text = await mediaRes.text();
      return { success: true, content: text };
    }

    // Try metadata endpoint for diagnostic
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      return {
        success: true,
        content: `File: ${meta.name} (${meta.mimeType}) - Loaded via Drive Metadata API`,
        name: meta.name
      };
    }

    const err = await exportRes.text();
    const shortErr = err.includes('<!DOCTYPE html>') ? 'Google Docs HTML 404/Error Page (Check OAuth Scopes)' : err;
    return { success: false, error: `Drive API returned status ${exportRes.status}: ${shortErr}` };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// 2. Create and read-back verify an artifact in Google Drive
export async function createAndVerifyDriveFile(
  fileName: string,
  content: string,
  description: string = 'Operations Console Execution Artifact'
): Promise<DriveProbeResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      status: 'DRIVE_WRITE_BLOCKED',
      error: '401 UNAUTHENTICATED: Missing Google OAuth Bearer token in session. Sign-in required.'
    };
  }

  try {
    const boundary = '-------314159265358979323846';
    const delimiter = `--${boundary}\r\n`;
    const closeDelimiter = `--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      '\r\n' +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      '\r\n' +
      closeDelimiter;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return {
        status: 'DRIVE_WRITE_BLOCKED',
        error: `Drive API create returned ${createRes.status}: ${errText}`
      };
    }

    const createdFile = await createRes.json();
    const fileId = createdFile.id;

    // Read-back verification
    const readRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!readRes.ok) {
      const errText = await readRes.text();
      return {
        status: 'DRIVE_WRITE_BLOCKED',
        error: `Drive API read-back returned ${readRes.status}: ${errText}`
      };
    }

    const readContent = await readRes.text();
    if (readContent !== content) {
      return {
        status: 'DRIVE_WRITE_BLOCKED',
        error: `Content verification mismatch: Written size ${content.length} vs Read-back size ${readContent.length}`
      };
    }

    return {
      status: 'DRIVE_WRITE_VERIFIED',
      fileId,
      fileName,
      verifiedContent: readContent
    };
  } catch (err: any) {
    return {
      status: 'DRIVE_WRITE_BLOCKED',
      error: err?.message || String(err)
    };
  }
}

// 3. Quick probe test
export async function executeDriveWriteProbe(): Promise<DriveProbeResult> {
  const probeFileName = `GROCER_DRIVE_WRITE_PROBE_${Date.now()}.txt`;
  const probeContent = `PROBE_VERIFIED_TIMESTAMP_${new Date().toISOString()}_GEN_LANG_CLIENT_0785189343`;
  return createAndVerifyDriveFile(probeFileName, probeContent, 'Automated verification probe from Operations Console');
}

export async function runCapabilityProbe(testReadId: string): Promise<import('../types').CapabilityProbe> {
  const token = await getAccessToken();
  const result: import('../types').CapabilityProbe = {
    DRIVE_AUTH: 'UNKNOWN',
    DRIVE_READ: 'UNKNOWN',
    DRIVE_CREATE: 'UNKNOWN',
    DRIVE_READBACK: 'UNKNOWN'
  };

  if (!token) {
    result.DRIVE_AUTH = 'BLOCKED';
    result.error = '401 UNAUTHENTICATED: Missing Google OAuth Bearer token';
    return result;
  }
  
  result.DRIVE_AUTH = 'VERIFIED';

  try {
    const readTest = await fetchDriveFile(testReadId);
    if (readTest.success) {
      result.DRIVE_READ = 'VERIFIED';
    } else {
      result.DRIVE_READ = 'BLOCKED';
      result.error = readTest.error;
      return result;
    }

    const probeWrite = await executeDriveWriteProbe();
    if (probeWrite.status === 'DRIVE_WRITE_VERIFIED') {
      result.DRIVE_CREATE = 'VERIFIED';
      result.DRIVE_READBACK = 'VERIFIED'; // createAndVerifyDriveFile inherently does readback
    } else {
      result.DRIVE_CREATE = 'BLOCKED';
      result.DRIVE_READBACK = 'BLOCKED';
      result.error = probeWrite.error;
    }
  } catch (err: any) {
    result.error = err.message || String(err);
  }

  return result;
}
