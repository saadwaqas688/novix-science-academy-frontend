/**
 * Reads an attendance sheet: one row per student, first column = name, then one column per date
 * with P / A / L marks. Works with .xlsx (via read-excel-file) and .csv files.
 */
export type Mark = 'present' | 'absent' | 'leave';
export interface SheetRow { name: string; group?: string; records: { date: string; status: Mark }[] }
export interface ParsedSheet {
  rows: SheetRow[];
  dates: string[];
  counts: Record<Mark, number>;
  skippedCells: number;
  unknownValues: string[];
  dayOnlyHeaders: boolean;
}
type Cell = string | number | boolean | Date | null | undefined;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
};
const year4 = (y: number) => (y < 100 ? 2000 + y : y);

/** Turns a header cell into YYYY-MM-DD. `month` ("YYYY-MM") is used when the header is only a day number. */
export function headerToDate(c: Cell, month: string): { date: string | null; dayOnly?: boolean } {
  if (c instanceof Date && !isNaN(+c)) return { date: iso(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate()) };
  if (typeof c === 'number') {
    if (c >= 20000 && c <= 80000) { const d = new Date(Math.round((c - 25569) * 86400000)); return { date: iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) }; }
    if (Number.isInteger(c) && c >= 1 && c <= 31) { const [y, m] = month.split('-').map(Number); return { date: iso(y, m, c), dayOnly: true }; }
    return { date: null };
  }
  if (typeof c !== 'string') return { date: null };
  const s = c.trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ').replace(/\s+/g, ' ');
  if (!s) return { date: null };
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return { date: iso(+m[1], +m[2], +m[3]) };
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/); // DD/MM/YYYY (Pakistan)
  if (m) return { date: iso(year4(+m[3]), +m[2], +m[1]) };
  m = s.match(/^(\d{1,2})[ -]([a-z]{3})[a-z]*[ -]?(\d{2,4})?$/); // 12 Nov 2026 / 12-Nov-26 / 12 Nov
  if (m && MONTHS.includes(m[2])) { const [y] = month.split('-').map(Number); return { date: iso(m[3] ? year4(+m[3]) : y, MONTHS.indexOf(m[2]) + 1, +m[1]) }; }
  m = s.match(/^([a-z]{3})[a-z]* (\d{1,2})(?: (\d{2,4}))?$/); // Nov 12 2026
  if (m && MONTHS.includes(m[1])) { const [y] = month.split('-').map(Number); return { date: iso(m[3] ? year4(+m[3]) : y, MONTHS.indexOf(m[1]) + 1, +m[2]) }; }
  m = s.match(/^(\d{1,2})$/);
  if (m) { const [y, mo] = month.split('-').map(Number); return { date: iso(y, mo, +m[1]), dayOnly: true }; }
  return { date: null };
}

export function cellToMark(c: Cell): Mark | null | 'unknown' {
  if (c === null || c === undefined) return null;
  if (typeof c === 'boolean') return c ? 'present' : 'absent';
  if (typeof c === 'number') return c === 1 ? 'present' : c === 0 ? 'absent' : 'unknown';
  if (c instanceof Date) return 'unknown';
  const s = c.trim().toLowerCase();
  if (!s || s === '-' || s === '–') return null;
  if (['p', 'present', 'pr', 'y', 'yes', '✓', '✔', '√', '1', 'true'].includes(s)) return 'present';
  if (['a', 'absent', 'ab', 'abs', 'n', 'no', 'x', '✗', '✘', '0', 'false'].includes(s)) return 'absent';
  if (['l', 'leave', 'lv', 'on leave'].includes(s)) return 'leave';
  if (['h', 'holiday', 'off', 'sunday', 'sun', 'closed'].includes(s)) return null;
  return 'unknown';
}

const isNameHeader = (c: Cell) => typeof c === 'string' && /name|student|طالب|نام/i.test(c);
const isGroupHeader = (c: Cell) => typeof c === 'string' && /^(class|section|group|batch|grade)\b/i.test(c.trim());

export function parseSheet(data: Cell[][], month: string): ParsedSheet {
  const rows = data.filter((r) => r && r.some((c) => c !== null && c !== undefined && String(c).trim() !== ''));
  // header = first row (of the first 10) with at least 2 date-looking cells
  let h = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    if (rows[i].filter((c) => headerToDate(c, month).date).length >= 2) { h = i; break; }
  }
  if (h < 0) throw new Error('Could not find the dates row. The first row should be: Name, then one column per date (e.g. 12/11/2026).');
  const header = rows[h];
  const dateCols: { col: number; date: string }[] = [];
  let dayOnlyHeaders = false;
  header.forEach((c, col) => {
    const r = headerToDate(c, month);
    if (r.date && !isNameHeader(c)) { dateCols.push({ col, date: r.date }); if (r.dayOnly) dayOnlyHeaders = true; }
  });
  const dateColSet = new Set(dateCols.map((d) => d.col));
  let nameCol = header.findIndex(isNameHeader);
  if (nameCol < 0) nameCol = header.findIndex((_, col) => !dateColSet.has(col) && rows.slice(h + 1, h + 6).some((r) => typeof r[col] === 'string' && /[a-z]/i.test(String(r[col]))));
  if (nameCol < 0) throw new Error('Could not find the student name column.');
  const groupCol = header.findIndex((c, col) => col !== nameCol && !dateColSet.has(col) && isGroupHeader(c));

  const counts: Record<Mark, number> = { present: 0, absent: 0, leave: 0 };
  const unknown = new Set<string>();
  let skippedCells = 0;
  const out: SheetRow[] = [];
  for (const r of rows.slice(h + 1)) {
    const name = String(r[nameCol] ?? '').trim().replace(/\s+/g, ' ');
    if (!name || /^(total|sum|average)\b/i.test(name)) continue;
    const records: SheetRow['records'] = [];
    for (const { col, date } of dateCols) {
      const m = cellToMark(r[col]);
      if (m === 'unknown') { skippedCells++; unknown.add(String(r[col]).trim().slice(0, 12)); continue; }
      if (!m) continue;
      counts[m]++;
      records.push({ date, status: m });
    }
    const group = groupCol >= 0 && r[groupCol] !== null && r[groupCol] !== undefined ? String(r[groupCol]).trim() : undefined;
    out.push({ name: name.slice(0, 120), group: group ? group.slice(0, 60) : undefined, records });
  }
  if (!out.length) throw new Error('No student rows were found under the header row.');
  return { rows: out, dates: [...new Set(dateCols.map((d) => d.date))].sort(), counts, skippedCells, unknownValues: [...unknown].slice(0, 8), dayOnlyHeaders };
}

/** Minimal CSV reader (quoted fields, comma or semicolon). */
export function parseCsv(text: string): string[][] {
  const delim = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const out: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); out.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); out.push(row); }
  return out;
}

export async function readAttendanceFile(file: File, month: string): Promise<ParsedSheet> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) return parseSheet(parseCsv((await file.text()).replace(/^﻿/, '')), month);
  if (lower.endsWith('.xls')) throw new Error('Old .xls files are not supported. In Excel choose File → Save As → Excel Workbook (.xlsx).');
  const { readSheet } = await import('read-excel-file/universal');
  const data = (await readSheet(await file.arrayBuffer())) as Cell[][];
  return parseSheet(data, month);
}

/** A ready-to-fill CSV template (opens in Excel). */
export function templateCsv(): string {
  const d = new Date();
  const days = Array.from({ length: 6 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() - 5 + i); return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`; });
  return ['Student Name,Class,' + days.join(','), 'Ali Raza,10-A,P,P,A,P,L,P', 'Sana Khan,10-A,P,A,P,P,P,P', 'Hamza Ali,9-B,A,P,P,P,P,A'].join('\r\n') + '\r\n';
}
