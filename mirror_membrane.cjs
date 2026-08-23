const { google } = require('googleapis');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function main() {
  const token = fs.readFileSync('RECEIVED_TOKEN.txt', 'utf8').trim();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const files = [
    { id: '1PbHB7uzUJ6UpOu5brLeNwRw8-SOAc4ZTdGLiq9RJfGo', name: 'CITY ZERO — RESEARCH MEMBRANE & RECOLLECTION MAP v0.1' },
    { id: '1ETH7KyGcCXo5-aabICMlUKxF9nQVL1XL363ku-ti92c', name: 'CASE STUDY 001 — INSTITUTIONAL SELF-BINDING ACROSS CLAUDE SESSIONS — 2026-08-18→19' },
    { id: '1yD2eXt0krATkI95uzOtpxsLuTaDxHvXHfov-gbwuA4Q', name: 'CASE STUDY 001 — EVIDENCE LEDGER' },
    { id: '1jUn-a818GEOeSc_QwQAGE-pV3M-mu7s0bBSHJ-FEDfM', name: 'CZ-COGNITION-PLASTICITY-001 — DEVELOPMENTAL PLASTICITY SEED v0.1' },
    { id: '1jn-bkvKBP97L7KNubVSkyvBb9SLbEXUdpdDF-1sWYWQ', name: 'MISSION — PATIENT ZERO DEVELOPMENTAL COGNITION v0.1 — AI STUDIO — 2026-08-20' }
  ];

  const mirrorDir = 'CITY_ZERO_RESEARCH_MEMBRANE_MIRROR';
  if (!fs.existsSync(mirrorDir)) {
    fs.mkdirSync(mirrorDir);
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    files: []
  };

  const receipt = {
    MIRROR_FOLDER: mirrorDir,
    SOURCES_REQUESTED: files.length,
    SOURCES_DOWNLOADED: 0,
    SOURCES_READ_BACK_VERIFIED: 0,
    FAILED_SOURCES: [],
    HASHES_RECORDED: 0,
  };

  for (const f of files) {
    try {
      const res = await drive.files.export({
        fileId: f.id,
        mimeType: 'text/plain'
      });
      const content = res.data;
      if (content && content.length > 0) {
        const filePath = path.join(mirrorDir, f.name + '.txt');
        fs.writeFileSync(filePath, content);
        
        // Read back
        const readBack = fs.readFileSync(filePath, 'utf8');
        if (readBack === content) {
          receipt.SOURCES_DOWNLOADED++;
          receipt.SOURCES_READ_BACK_VERIFIED++;
          const hash = crypto.createHash('sha256').update(readBack).digest('hex');
          receipt.HASHES_RECORDED++;
          manifest.files.push({
            id: f.id,
            name: f.name,
            localPath: filePath,
            size: Buffer.byteLength(readBack),
            sha256: hash
          });
          console.log(`Success: ${f.name}`);
        } else {
            receipt.FAILED_SOURCES.push({ id: f.id, error: 'Readback verification failed' });
        }
      } else {
         receipt.FAILED_SOURCES.push({ id: f.id, error: 'Empty content' });
      }
    } catch (err) {
      receipt.FAILED_SOURCES.push({ id: f.id, error: err.message });
      console.error(`Failed: ${f.name} - ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(mirrorDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
  console.log('\n--- MEMBRANE RECEIPT ---');
  console.log(JSON.stringify(receipt, null, 2));
}

main();
