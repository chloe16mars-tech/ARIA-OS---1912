#!/usr/bin/env node
/**
 * scripts/build-mobile.mjs
 *
 * Produces a Capacitor-ready static bundle and syncs it into the Android
 * project. Steps:
 *   1. Re-generate src/environments/* from .env (target: mobile).
 *   2. Run `ng build` (production configuration).
 *   3. Promote dist/aria-os/browser/index.csr.html → index.html so the
 *      Capacitor WebView finds it (Android opens index.html, not csr.html).
 *   4. Strip server-side artefacts that should not ship in the APK.
 *   5. `npx cap sync android` to push the bundle into android/app/src.
 *
 * Cross-platform (no `cp`, no `shx`).
 */
import { execSync } from 'node:child_process';
import {
  readdirSync,
  copyFileSync,
  existsSync,
  rmSync,
  statSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BROWSER_DIR = resolve(ROOT, 'dist/aria-os/browser');
const SERVER_DIR = resolve(ROOT, 'dist/aria-os/server');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function step(label) {
  console.log(`\n──── ${label} ────`);
}

step('1/5  Generating mobile environment from .env');
run('node scripts/set-env.mjs --target=mobile,prod');

step('2/5  Building Angular (mobile configuration)');
run('npx ng build --configuration=mobile');

step('3/5  Promoting index.csr.html → index.html');
const csr = join(BROWSER_DIR, 'index.csr.html');
const indexHtml = join(BROWSER_DIR, 'index.html');
if (!existsSync(csr)) {
  console.error(`[build-mobile] expected ${csr} not found. Did the build succeed?`);
  process.exit(1);
}
copyFileSync(csr, indexHtml);

step('4/5  Cleaning server bundle (not shipped in the APK)');
if (existsSync(SERVER_DIR)) {
  rmSync(SERVER_DIR, { recursive: true, force: true });
}
// Drop SSR-only leftovers from the browser folder
for (const f of readdirSync(BROWSER_DIR)) {
  if (f === 'index.csr.html' || f === 'prerendered-routes.json') {
    rmSync(join(BROWSER_DIR, f), { force: true });
  }
}
const sizeMb = (
  readdirSync(BROWSER_DIR).reduce(
    (acc, f) => acc + statSync(join(BROWSER_DIR, f)).size,
    0
  ) /
  1024 /
  1024
).toFixed(2);
console.log(`[build-mobile] browser bundle ready (${sizeMb} MB at root)`);

step('5/5  Syncing into Android project');
run('npx cap sync android');

console.log('\nMobile build complete. Open android/ in Android Studio to assemble the APK.');
