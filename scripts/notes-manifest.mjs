// Builds two manifests from files in public/ (runs before `npm run build` and `npm run dev`):
//   public/notes/class-<n>/<subject>/ch-<n>.pdf     -> src/lib/notes-manifest.json
//   public/quizzes/class-<n>/<subject>/ch-<n>.json  -> src/lib/quiz-manifest.json
// To add content: drop the file in the right folder and push.
import fs from 'fs';
import path from 'path';

function walk(root, ext, onFile) {
  if (!fs.existsSync(root)) return;
  for (const cls of fs.readdirSync(root)) {
    const m = cls.match(/^class-(\d+)$/); if (!m) continue;
    for (const subject of fs.readdirSync(path.join(root, cls))) {
      const dir = path.join(root, cls, subject);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of fs.readdirSync(dir)) {
        const c = file.match(new RegExp(`^ch-(\\d+)\\.${ext}$`, 'i')); if (!c) continue;
        onFile({ cls: m[1], subject, chapter: Number(c[1]), file: path.join(dir, file), url: `/${path.basename(root)}/${cls}/${subject}/${file}` });
      }
    }
  }
}

const notes = {};
walk(path.resolve('public/notes'), 'pdf', (f) => { notes[`${f.cls}/${f.subject}/${f.chapter}`] = { url: f.url, sizeBytes: fs.statSync(f.file).size }; });
fs.writeFileSync(path.resolve('src/lib/notes-manifest.json'), JSON.stringify(notes, null, 2) + '\n');

const quizzes = {};
walk(path.resolve('public/quizzes'), 'json', (f) => {
  const data = JSON.parse(fs.readFileSync(f.file, 'utf8'));
  const ids = new Set();
  for (const q of data.quizzes) {
    if (ids.has(q.id)) throw new Error(`${f.file}: duplicate quiz id ${q.id}`);
    ids.add(q.id);
    q.questions.forEach((x, i) => {
      if (!x.q || !Array.isArray(x.options) || x.options.length < 2 || !(x.answer >= 0 && x.answer < x.options.length))
        throw new Error(`${f.file}: quiz ${q.id} question ${i + 1} is invalid`);
    });
  }
  quizzes[`${f.cls}/${f.subject}/${f.chapter}`] = {
    url: f.url, chapterTitle: data.chapterTitle || '',
    quizzes: data.quizzes.map((q) => ({ id: q.id, topic: q.topic, count: q.questions.length })),
  };
});
fs.writeFileSync(path.resolve('src/lib/quiz-manifest.json'), JSON.stringify(quizzes, null, 2) + '\n');
console.log(`manifest: ${Object.keys(notes).length} notes file(s), ${Object.values(quizzes).reduce((n, c) => n + c.quizzes.length, 0)} quiz(zes)`);
