import { existsSync } from 'node:fs';

console.log('OFFLINE');
const kit = 'demos/rebrand/brand/acme-cardio';
if (!existsSync(`${kit}/brand.md`) || !existsSync(`${kit}/logo.svg`)) {
  console.error('rebrand: committed Acme Cardio brand kit is missing');
  process.exit(1);
}
console.log('G3 key-free: committed Acme Cardio brand kit. No outside fetch.');
