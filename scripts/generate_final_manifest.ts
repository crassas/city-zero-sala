import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function getFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return "FILE_NOT_FOUND";
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

const modifiedFiles = [
  "scripts/verify_work_units.ts",
  "src/data/operationsConsoleV0.ts",
  "src/types.ts",
  "src/App.tsx",
  "src/components/WorkUnitList.tsx",
  "src/components/WorkUnitDetail.tsx",
  "src/components/ProposedActionsPanel.tsx",
  "src/components/OwnerGatesPanel.tsx",
  "src/components/ConsoleSummaryHeader.tsx",
  "src/components/CanonicalEntrypointCard.tsx"
];

const fileHashes: Record<string, string> = {};
modifiedFiles.forEach(file => {
  fileHashes[file] = getFileHash(path.join(process.cwd(), file));
});

const timestamp = new Date().toISOString();

const receipt = {
  receipt_id: "RUN_LONG_RECEIPT_V0_FINAL",
  timestamp,
  canonical_source_id: "15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w",
  source_name: "operations_console.v0",
  work_units_attempted: 13,
  work_units_done_verified: 10,
  partial: 0,
  blocked: 3,
  modified_files_hashes: fileHashes,
  unresolved_items: [
    "WU-02: Requires OWNER_GATE Constitution Mutation Token",
    "WU-03: Requires Drive OAuth Scope Authorization (DRIVE_ACCESS_NOT_AVAILABLE)",
    "WU-08: Requires OWNER_GATE Security Token"
  ],
  exact_return_point: "GROCER_CHECKPOINT_FINAL_EXPORT_READY"
};

fs.writeFileSync(path.join(process.cwd(), 'RUN_LONG_RECEIPT.json'), JSON.stringify(receipt, null, 2));

const manifest = {
  manifest_version: "1.0",
  generated_at: timestamp,
  source_drive_id: "15sYuRNT4GGCqd_GjtzbpLt5vzVuanc6wlgjjFqd3-1w",
  source_name: "operations_console.v0",
  file_hashes: fileHashes,
  receipt_hash: getFileHash(path.join(process.cwd(), 'RUN_LONG_RECEIPT.json'))
};

fs.writeFileSync(path.join(process.cwd(), 'RUN_LONG_MANIFEST.json'), JSON.stringify(manifest, null, 2));

console.log("Hashes and Manifest updated successfully.");
