const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  const token = fs.readFileSync('RECEIVED_TOKEN.txt', 'utf8').trim();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const res = await drive.files.list({
      q: "name contains '01 — CITY ZERO' or name contains '00 — START HERE'",
      fields: 'files(id, name, mimeType)',
    });
    console.log(res.data.files);
    for (const file of res.data.files || []) {
      const content = await drive.files.export({
        fileId: file.id,
        mimeType: 'text/plain'
      });
      console.log(`\n=== ${file.name} ===\n`);
      console.log(content.data);
      fs.writeFileSync(file.name.replace(/\s+/g, '_') + '.txt', content.data);
    }
  } catch (err) {
    console.error('Error fetching files:', err.message);
  }
}

main();
