import { readFileSync } from 'node:fs';

console.log('OFFLINE');
const readme = readFileSync('demos/factory-e2e/README.md', 'utf8');
if (readme.includes('pending on Giovanni')) {
  console.error('factory-e2e: runbook still uses the old key blocker wording');
  process.exit(1);
}
console.log('L8 key-free factory walk. No API keys.');
