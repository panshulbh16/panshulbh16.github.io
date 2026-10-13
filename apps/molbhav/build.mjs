// Builds the public demo page (molbhav/index.html) from the app source and the sample data.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = process.argv[2] || join(root, 'molbhav', 'index.html');

const src = readFileSync(join(here, 'src', 'molbhav.html'), 'utf8');
const seed = JSON.parse(readFileSync(join(here, 'seed', 'all.json'), 'utf8'));

const headEnd = src.indexOf('<style>');
const headBits = src.slice(0, headEnd).replace('<title>Molbhav</title>\n', '').trim();
const body = src.slice(headEnd).trim();

const cfg = {
  anchor: '2026-10-12',
  version: 1,
  storageKey: 'molbhav-demo-v1',
  backLink: { href: '/', label: 'Panshul Bharadwaj' },
  seed,
};
const cfgJs = JSON.stringify(cfg).replace(/<\//g, '<\\/');

const iconSvg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='5' fill='#15253A'/>"
  + "<g fill='none' stroke='#5AA6EE' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' transform='translate(2.4 2.4) scale(.8)'>"
  + "<path d='M12 5v14.5M8 19.5h8M4.5 7.5h15M4.5 7.5 2 13.5M4.5 7.5 7 13.5M19.5 7.5 17 13.5M19.5 7.5 22 13.5'/>"
  + "<path d='M1.6 13.5h5.8a2.9 2.9 0 0 1-5.8 0ZM16.6 13.5h5.8a2.9 2.9 0 0 1-5.8 0Z' fill='#5AA6EE' stroke='none'/></g></svg>";
const icon = 'data:image/svg+xml,' + encodeURIComponent(iconSvg);

const title = 'Molbhav · live demo';
const desc = 'Live demo of Molbhav, a sales CRM for Indian manufacturers and distributors: leads, opportunities, GST-ready quotes with discount approvals, territory forecasting and AI-assisted selling.';
const url = 'https://panshulbh16.github.io/molbhav/';

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="author" content="Panshul Bharadwaj">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Panshul Bharadwaj">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://panshulbh16.github.io/assets/img/molbhav.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#15253A">
<link rel="icon" href="${icon}" type="image/svg+xml">
${headBits}
<style>[hidden]{display:none!important}body{margin:0}img{max-width:100%}</style>
<script>try{localStorage.removeItem('lathe-demo-v1')}catch(e){}window.MOLBHAV_DEMO=${cfgJs};</script>
</head>
<body>
${body}
</body>
</html>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page);
console.log(`built ${out} (${page.length} bytes)`);
