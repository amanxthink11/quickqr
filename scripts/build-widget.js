/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const srcFile = path.join(rootDir, 'src', 'widget', 'index.ts');
const publicDir = path.join(rootDir, 'public');
const outFile = path.join(publicDir, 'widget.js');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('[build-widget] Bundling widget to public/widget.js...');

try {
  // Use esbuild to bundle src/widget/index.ts into an IIFE
  execSync(
    `npx --yes esbuild "${srcFile}" --bundle --minify --format=iife --target=es2020 --outfile="${outFile}"`,
    { stdio: 'inherit', cwd: rootDir }
  );
  const stats = fs.statSync(outFile);
  console.log(`[build-widget] Successfully built public/widget.js (${Math.round(stats.size / 1024)} KB)`);
} catch (error) {
  console.error('[build-widget] Failed to build widget:', error);
  process.exit(1);
}
