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
    { id: '1NU1GIoCNUDCcZXkWoUxniDCbbtX4-6mQEA9NJjK-SAo', name: '00 — START HERE — CITY ZERO CANONICAL BOOT GATE v1' },
    { id: '16OPM7DFb6PK9Qk0svVY1C5qJkCoMnzYqGLnQmUsTBKg', name: 'CITY ZERO — GENESIS CONVERGENCE — 2026-08-20' },
    { id: '1VqjLd5Itt-JNjane13RdMV67ETXsYtVJFV4sqityjOA', name: 'CZ-CONSCIOUSNESS-001 — CONSCIÊNCIA LIMITADA — SEED v0.1' },
    { id: '1DZMrfCNQVa-KpGuvnchpSkhh39DWBLyjvDuIUdW6kaA', name: 'CITY ZERO — DIÁRIO DE GÉNESE E CONTINUIDADE — 2026-08-20' },
    { id: '151T3D_PNjEi9CINuDSzBvBlTAdBrsCtd1E-5E99QMrE', name: 'CZ — PATIENT ZERO GEMINI — ROOT BOOTSTRAP PROMPT v0.1' },
    { id: '1_EONClFsTf3oiw9LszU5x938ddWdyQk3mGhCxyGWVXg', name: 'CTRL S CHECKPOINT — SOCIETY CLOUDFLARE↔NEON — 2026-08-20' },
    { id: '1C8KoP-Arlnb4Db7NULGLpyKraeySCjn9EiOOrgvEcHU', name: 'CTRL S CHECKPOINT — SOCIETY NEON V1 MAIN — 2026-08-20' },
    { id: '1tkuW-ORUFcrnOt23MfMdpGyszWvSQNdEY0NOclxBmxk', name: 'MISSION — FIND CLOUDFLARE ↔ NEON ENTRY POINT — READ ONLY — 2026-08-20' },
    { id: '1lg0w868jW8Tf_-BTy_23coJAkEpAfQiIYrPOXeavcmo', name: 'CITY ZERO — AI STUDIO SELF-CONTAINED BOOT PACK — 2026-08-20' }
  ];

  const mirrorDir = 'CITY_ZERO_CANONICAL_MIRROR';
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
  console.log('\n--- RECEIPT ---');
  console.log(JSON.stringify(receipt, null, 2));
}

main();
