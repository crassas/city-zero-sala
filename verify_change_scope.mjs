import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const scope = JSON.parse(fs.readFileSync('ACTIVE_CHANGE_SCOPE.json', 'utf8'));
const policy = JSON.parse(fs.readFileSync('PROTECTED_PATHS.json', 'utf8'));
const ownerOverride = process.env[policy.ownerOverrideEnvironment] === 'AUTHORIZED_BY_OWNER';
const protectedHashes = JSON.parse(fs.readFileSync('PROTECTED_HASHES.json', 'utf8'));

if (Date.now() > Date.parse(scope.expiresAt)) throw new Error('CHANGE_SCOPE_EXPIRED');

for (const [path, expected] of Object.entries(protectedHashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  if (actual !== expected && !ownerOverride) throw new Error(`PROTECTED_INTEGRITY_FAILED: ${path}`);
}

let changed = [];
try {
  const inside = execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' }).trim();
  if (inside === 'true') {
    changed = execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
      .split('\n').map(v => v.trim()).filter(Boolean);
  }
} catch {
  changed = (process.env.GRAPH_ENGINEER_CHANGED_PATHS ?? '')
    .split(',').map(v => v.trim()).filter(Boolean);
}

const outside = changed.filter(path => !scope.allowedPaths.includes(path));
if (outside.length) throw new Error(`OUTSIDE_AUTHORIZED_ROUTE: ${outside.join(', ')}`);
if (changed.length > scope.maxChangedFiles) throw new Error(`CHANGE_LIMIT_EXCEEDED: ${changed.length}`);

const touchesProtected = changed.filter(path => policy.protectedPaths.includes(path));
if (policy.proposalOnlyActors.includes(scope.actor) && touchesProtected.length && !ownerOverride) {
  throw new Error(`PROTECTED_PATH_REJECTED: ${touchesProtected.join(', ')}`);
}

console.log(`CHANGE_SCOPE_VERIFIED actor=${scope.actor} files=${changed.length} protected=${Object.keys(protectedHashes).length}`);
