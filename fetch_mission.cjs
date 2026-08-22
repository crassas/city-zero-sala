const { google } = require('googleapis');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function main() {
  const token = fs.readFileSync('RECEIVED_TOKEN.txt', 'utf8').trim();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const res = await drive.files.list({
      q: "name contains 'MISSION — PATIENT ZERO DEVELOPMENTAL COGNITION'",
      fields: 'files(id, name, mimeType)',
    });
    
    if (res.data.files && res.data.files.length > 0) {
      const file = res.data.files[0];
      console.log(`Found: ${file.name} (${file.id})`);
      
      const exportRes = await drive.files.export({
        fileId: file.id,
        mimeType: 'text/plain'
      });
      
      const mirrorDir = 'CITY_ZERO_CANONICAL_MIRROR';
      if (!fs.existsSync(mirrorDir)) fs.mkdirSync(mirrorDir);
      
      const filePath = path.join(mirrorDir, file.name + '.txt');
      fs.writeFileSync(filePath, exportRes.data);
      
      const readBack = fs.readFileSync(filePath, 'utf8');
      if (readBack === exportRes.data) {
         console.log(`Successfully downloaded and verified. Hash: ${crypto.createHash('sha256').update(readBack).digest('hex')}`);
         console.log("\n--- MISSION CONTENT START ---\n");
         console.log(readBack.substring(0, 3000)); // Print first part to understand
         if(readBack.length > 3000) {
             console.log("\n... (fetching rest ...)\n");
             console.log(readBack.substring(3000));
         }
      }
    } else {
      console.log('Mission file not found in Drive.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
