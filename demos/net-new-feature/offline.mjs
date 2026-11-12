import { existsSync } from 'node:fs';

console.log('OFFLINE');
if (!existsSync('demos/net-new-feature/prompt.md')) {
  console.error('net-new-feature: missing prompt.md');
  process.exit(1);
}
console.log('G1 key-free: prompt.md is local. No cloud agent is started.');
