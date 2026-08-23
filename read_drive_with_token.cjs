const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  if (!fs.existsSync('RECEIVED_TOKEN.txt')) {
    console.log("Token not received yet.");
    return;
  }
  const token = fs.readFileSync('RECEIVED_TOKEN.txt', 'utf8').trim();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const res = await drive.files.list({
      q: "name contains 'CITY ZERO'",
      fields: 'files(id, name, mimeType)',
    });
    console.log("Found files:");
    res.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
  } catch (err) {
    console.error('Error fetching files:', err.message);
  }
}

main();
