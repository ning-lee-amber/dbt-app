// Writes public/version.json before each deploy. The app compares it when you return to it
// and reloads itself if a newer version has been deployed. Run via: npm run deploy
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

let commit = 'nogit';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {}
const v = `${new Date().toISOString()}-${commit}`;
writeFileSync(new URL('../public/version.json', import.meta.url), JSON.stringify({ v }) + '\n');
console.log('version', v);
