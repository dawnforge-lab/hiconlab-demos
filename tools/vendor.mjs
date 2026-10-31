// Copies third-party files from node_modules into the repo, so demos never call a CDN.
// What gets copied is listed in vendor.json:
//   { "copy": [ { "from": "node_modules/x/file.js", "to": "shared/vendor/x@1.2.3/" } ],
//     "modules": [ { "from": "node_modules/three/examples/jsm/loaders/GLTFLoader.js",
//                    "base": "node_modules/three/examples/jsm", "to": "shared/vendor/three@0.187.0/addons" } ] }
// "copy" entries copy one file (or a folder) as is. "modules" entries copy an ES module
// together with every relative import it pulls in, keeping the folder layout under "base".
// Usage: npm run vendor
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { ROOT } from './serve.mjs';

const manifest = JSON.parse(readFileSync(join(ROOT, 'vendor.json'), 'utf8'));
let count = 0;

for (const entry of manifest.copy || []) {
  const from = join(ROOT, entry.from);
  if (!existsSync(from)) throw new Error(`vendor: missing ${entry.from} (run npm install?)`);
  const isDir = statSync(from).isDirectory();
  const to = entry.to.endsWith('/') && !isDir ? join(ROOT, entry.to, basename(from)) : join(ROOT, entry.to);
  mkdirSync(isDir ? to : dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  count++;
}

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)|import\s*['"](\.{1,2}\/[^'"]+)['"]/g;

for (const entry of manifest.modules || []) {
  const base = resolve(ROOT, entry.base);
  const queue = [resolve(ROOT, entry.from)];
  const seen = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (!existsSync(file)) throw new Error(`vendor: missing ${relative(ROOT, file)}`);
    const out = join(ROOT, entry.to, relative(base, file));
    mkdirSync(dirname(out), { recursive: true });
    cpSync(file, out);
    count++;
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1] || m[2] || m[3];
      queue.push(resolve(dirname(file), spec));
    }
  }
}

console.log(`vendor: ${count} files copied`);
