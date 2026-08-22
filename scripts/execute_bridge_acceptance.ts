import { fetchDriveFile, createAndVerifyDriveFile } from '../src/lib/driveService';
import { getAccessToken } from '../src/lib/firebaseAuth';

async function executeBridgeAcceptance() {
  const instructionSourceId = "1cQWws-voD4BiyuRs-pDYL_lSH8QZaQkvvb_41L0k9Ks";
  console.log(`=== EXECUTING BRIDGE ACCEPTANCE TEST FOR DRIVE ID: ${instructionSourceId} ===`);

  const token = await getAccessToken();
  if (!token) {
    console.error("BLOCKER_DETECTED: 401 UNAUTHENTICATED: Missing Google OAuth Bearer token in session / headless environment.");
    console.log("DRIVE_FLOW_BLOCKED | reason=OAUTH_SESSION_UNAVAILABLE | auth_required=true");
    return;
  }

  const fetchRes = await fetchDriveFile(instructionSourceId);
  if (!fetchRes.success) {
    console.error(`BLOCKER_DETECTED: ${fetchRes.error}`);
    console.log(`DRIVE_FLOW_BLOCKED | reason=${fetchRes.error}`);
    return;
  }

  const createRes = await createAndVerifyDriveFile(
    `bridge_acceptance_receipt_${Date.now()}.json`,
    JSON.stringify({ 
      instruction_source_id: instructionSourceId, 
      fetched_content: fetchRes.content, 
      timestamp: new Date().toISOString(),
      acceptance_status: "VERIFIED" 
    }, null, 2)
  );

  if (createRes.status !== 'DRIVE_WRITE_VERIFIED') {
    console.error(`BLOCKER_DETECTED: ${createRes.error}`);
    console.log(`DRIVE_FLOW_BLOCKED | reason=${createRes.error}`);
    return;
  }

  console.log(`NEW_DRIVE_FILE_ID: ${createRes.fileId}`);
  console.log(`VERIFICATION_STATUS: SUCCESS_READ_BACK_VERIFIED`);
  console.log(`BRIDGE_ACCEPTANCE_COMPLETE | target_id=${instructionSourceId} | new_file_id=${createRes.fileId} | readback_verified=true`);
}

executeBridgeAcceptance().catch((err) => {
  console.error("BLOCKER_DETECTED:", err.message);
  console.log(`DRIVE_FLOW_BLOCKED | reason=${err.message}`);
});
