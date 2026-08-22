import { fetchDriveFile, createAndVerifyDriveFile } from '../src/lib/driveService';
import { getAccessToken } from '../src/lib/firebaseAuth';

async function runRealFlow() {
  const instructionSourceId = "1r4j0j0t0F8-2ThCfu2jt0X7vf_zKAAy8Dw633o41uhU";
  console.log(`=== ATTEMPTING REAL AUTHENTICATED DRIVE FLOW ===`);
  console.log(`Instruction Source Drive ID: ${instructionSourceId}`);

  const token = await getAccessToken();
  if (!token) {
    console.error("BLOCKER_DETECTED: 401 UNAUTHENTICATED: Missing Google OAuth Bearer token in session / headless environment.");
    console.log("DRIVE_FLOW_BLOCKED | reason=OAUTH_SESSION_UNAVAILABLE | auth_required=true");
    return;
  }

  // If token somehow exists, attempt real fetch and create
  const fetchRes = await fetchDriveFile(instructionSourceId);
  if (!fetchRes.success) {
    console.error(`BLOCKER_DETECTED: ${fetchRes.error}`);
    console.log(`DRIVE_FLOW_BLOCKED | reason=${fetchRes.error}`);
    return;
  }

  const createRes = await createAndVerifyDriveFile(
    `real_completion_receipt_${Date.now()}.json`,
    JSON.stringify({ source: instructionSourceId, content: fetchRes.content, timestamp: new Date().toISOString() }, null, 2)
  );

  if (createRes.status !== 'DRIVE_WRITE_VERIFIED') {
    console.error(`BLOCKER_DETECTED: ${createRes.error}`);
    console.log(`DRIVE_FLOW_BLOCKED | reason=${createRes.error}`);
    return;
  }

  console.log(`NEW_DRIVE_FILE_ID: ${createRes.fileId}`);
  console.log(`VERIFICATION_STATUS: SUCCESS_READ_BACK_VERIFIED`);
}

runRealFlow().catch((err) => {
  console.error("BLOCKER_DETECTED:", err.message);
  console.log(`DRIVE_FLOW_BLOCKED | reason=${err.message}`);
});
