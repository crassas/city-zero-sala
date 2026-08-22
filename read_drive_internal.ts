import { fetchDriveFile, runCapabilityProbe } from './src/lib/driveService';

async function main() {
    try {
        console.log("Probing drive access...");
        const probe = await runCapabilityProbe('15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w');
        console.log("Probe result:", probe);
        
        // We cannot search natively with the current driveService (it only reads by ID), 
        // so we need the token directly to use the REST API
        console.log("Token check:", process.env.GOOGLE_OAUTH_TOKEN ? "Token exists" : "No token");
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
