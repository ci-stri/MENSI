// Kleiner lokaler Server nur für die Entwicklung: node tools/server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8123);
const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json',
};

createServer(async (anfrage, antwort) => {
  let pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';
  const datei = normalize(join(WURZEL, pfad));
  if (!datei.startsWith(WURZEL)) { antwort.writeHead(403).end(); return; }
  try {
    const inhalt = await readFile(datei);
    antwort.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(inhalt);
  } catch {
    antwort.writeHead(404).end('Nicht gefunden');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`MENSI läuft auf http://localhost:${PORT}`));
