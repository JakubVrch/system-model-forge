import { execFileSync } from 'node:child_process';
export default function setup() {
  execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
}
