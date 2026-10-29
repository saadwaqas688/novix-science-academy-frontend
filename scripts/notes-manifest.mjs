// Scans public/notes/class-<n>/<subject>/ch-<n>.pdf and writes src/lib/notes-manifest.json.
// Runs automatically before `npm run build` and `npm run dev`.
// To add notes: put the PDF at e.g. public/notes/class-9/physics/ch-3.pdf and push.
import fs from 'fs';
import path from 'path';

const root = path.resolve('public/notes');
const out = path.resolve('src/lib/notes-manifest.json');
const manifest = {};
if (fs.existsSync(root)) {
  for (const cls of fs.readdirSync(root)) {
    const m = cls.match(/^class-(\d+)$/); if (!m) continue;
    for (const subject of fs.readdirSync(path.join(root, cls))) {
      const dir = path.join(root, cls, subject);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of fs.readdirSync(dir)) {
        const c = file.match(/^ch-(\d+)\.pdf$/i); if (!c) continue;
        const size = fs.statSync(path.join(dir, file)).size;
        manifest[`${m[1]}/${subject}/${Number(c[1])}`] = { url: `/notes/${cls}/${subject}/${file}`, sizeBytes: size };
      }
    }
  }
}
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`notes manifest: ${Object.keys(manifest).length} file(s)`);
