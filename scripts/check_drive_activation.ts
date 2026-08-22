async function checkDriveActivation() {
  console.log("=== CHECKING GOOGLE DRIVE ACTIVATION ===");
  const token = process.env.GOOGLE_OAUTH_TOKEN;
  if (!token) throw new Error('DRIVE_AUTH_BLOCKED: GOOGLE_OAUTH_TOKEN is absent');
  const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`DRIVE_AUTH_BLOCKED: Google Drive returned ${response.status}`);
  const about = await response.json();
  if (!about?.user?.permissionId) throw new Error('DRIVE_AUTH_BLOCKED: account identity not verified');
  console.log(`DRIVE_AUTH_VERIFIED | permission_id=${about.user.permissionId}`);
}

checkDriveActivation().catch(error => { console.error(error.message); process.exit(1); });
