const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  const token = fs.readFileSync('RECEIVED_TOKEN.txt', 'utf8').trim();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const ids = [
    '1NU1GIoCNUDCcZXkWoUxniDCbbtX4-6mQEA9NJjK-SAo', 
    '189rKaYN4WaF2MxhLakr2R-oIUFvsvi47tFFMMCWlwlI'
  ];

  for (const id of ids) {
    const res = await drive.files.export({
      fileId: id,
      mimeType: 'text/plain'
    });
    fs.writeFileSync(id + '.txt', res.data);
    console.log(`Exported ${id}`);
  }

  const res = await drive.files.list({
    q: "name contains 'RECEIPT — CANONICAL BOOT GATE INSTALLED'",
    fields: 'files(id, name)',
  });
  
  if (res.data.files.length > 0) {
    for (const file of res.data.files) {
        const contentRes = await drive.files.export({
            fileId: file.id,
            mimeType: 'text/plain'
        });
        fs.writeFileSync(file.id + '.txt', contentRes.data);
        console.log(`Exported ${file.name} (${file.id})`);
    }
  } else {
    console.log("RECEIPT not found in search");
  }
}

main();
