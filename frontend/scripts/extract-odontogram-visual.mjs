import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const htmlPath = path.join(root, 'odontograma_visual_interativo.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/src="(data:image\/png;base64,[^"]+)"/);
if (!match) throw new Error('Imagem base64 não encontrada no HTML');

const b64 = match[1].replace('data:image/png;base64,', '');
const out = path.join(root, 'frontend/public/odontogram/odontograma-visual.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(b64, 'base64'));
console.log('Imagem extraída:', out, fs.statSync(out).size, 'bytes');
