const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  const token = process.env.GOOGLE_OAUTH_TOKEN;
  if (!token) {
    console.error("No token available in GOOGLE_OAUTH_TOKEN");
    return;
  }
  
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    // Look for the specific files
    const res = await drive.files.list({
      q: "name contains '00 — START HERE' or name contains 'RECEIPT — CANONICAL BOOT GATE INSTALLED' or name contains 'CITY ZERO'",
      fields: 'files(id, name, mimeType)',
    });
    
    if (res.data.files && res.data.files.length > 0) {
      for (const file of res.data.files) {
        console.log(`\n--- Found: ${file.name} (${file.id}) ---`);
        
        // Only export documents or text
        if (file.mimeType.includes('google-apps.document')) {
          const content = await drive.files.export({
            fileId: file.id,
            mimeType: 'text/plain'
          });
          console.log(content.data.substring(0, 1500) + (content.data.length > 1500 ? '\n... (truncated)' : ''));
        } else if (file.mimeType === 'text/plain' || file.mimeType.includes('json')) {
           const content = await drive.files.get({
            fileId: file.id,
            alt: 'media'
          });
          console.log(content.data.substring(0, 1500) + (content.data.length > 1500 ? '\n... (truncated)' : ''));
        } else {
           console.log(`Skipping content read for type: ${file.mimeType}`);
        }
      }
    } else {
      console.log('Files not found.');
    }
  } catch (err) {
    console.error('Error fetching files:', err.message);
  }
}

main();
