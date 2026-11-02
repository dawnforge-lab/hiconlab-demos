// Builds the public demos site into dist/ for Cloudflare Pages: the index, the demos, the shared tour and vendor
// files and the recorded media. Repo tooling and briefs (tools/, docs/) stay out.
// Usage: node tools/build-site.mjs
//
// FRAME_ANCESTORS (space-separated origins, an environment variable when building) lists the sites allowed to embed the demos;
// add the staging site's origin there. The demos are noindex: the portfolio pages on hiconlab.com are the pages
// meant for search.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './serve.mjs';

const OUT = join(ROOT, 'dist');
const PUBLIC = ['index.html', 'index-assets', 'demos', 'shared', 'media'];
const ancestors = (process.env.FRAME_ANCESTORS || 'https://hiconlab.com https://www.hiconlab.com').trim();

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const entry of PUBLIC) {
  if (!existsSync(join(ROOT, entry))) throw new Error(`missing ${entry}`);
  cpSync(join(ROOT, entry), join(OUT, entry), { recursive: true, filter: (src) => !src.endsWith('README.md') });
}

// Cloudflare Pages headers (https://developers.cloudflare.com/pages/configuration/headers/).
writeFileSync(
  join(OUT, '_headers'),
  `/*
  X-Robots-Tag: noindex
  Content-Security-Policy: frame-ancestors 'self' ${ancestors}
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff

/media/*
  Cache-Control: public, max-age=86400
`,
);
console.log(`dist/ ready (${PUBLIC.join(', ')}); frame-ancestors: ${ancestors}`);
