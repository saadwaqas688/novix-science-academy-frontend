// Copies the pdf.js worker into public/ so the in-app notes reader can load it.
import fs from 'fs';
const src = 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs';
fs.mkdirSync('public/pdfjs', { recursive: true });
fs.copyFileSync(src, 'public/pdfjs/pdf.worker.min.mjs');
console.log('pdf.js worker copied');
