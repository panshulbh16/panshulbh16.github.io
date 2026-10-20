// Copies only the public files into _site for the GitHub Pages deploy.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');
const publicPaths = ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'assets', 'page-destroyer'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const p of publicPaths) {
  if (!existsSync(join(root, p))) throw new Error(`missing public path: ${p}`);
  cpSync(join(root, p), join(out, p), { recursive: true });
}
console.log(`assembled ${publicPaths.length} paths into _site`);
