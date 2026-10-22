/**
 * 从 index.html 里的 EVENTS 生成 data/calendar.ics（订阅用）。
 * 输出是确定性的：同样的数据永远生成同样的文件，避免每次构建都产生无意义提交。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const HTML = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'data', 'calendar.ics');

const src = fs.readFileSync(HTML, 'utf8');
const start = src.indexOf('[', src.indexOf('const EVENTS = ['));
const end = src.indexOf('\n];', start);
if (start < 0 || end < 0) throw new Error('找不到 EVENTS');
const EVENTS = new Function(`return ${src.slice(start, end)}]`)();

const escape = (s) => String(s ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 73) return line;
  const out = [];
  let chunk = [];
  let size = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, 'utf8');
    if (size + b > 73) {
      out.push(chunk.join(''));
      chunk = [];
      size = 0;
    }
    chunk.push(ch);
    size += b;
  }
  if (chunk.length) out.push(chunk.join(''));
  return out[0] + out.slice(1).map((c) => '\r\n ' + c).join('');
}

const ymd = (d) => d.replace(/-/g, '');
const nextDay = (d) => {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10).replace(/-/g, '');
};

function stampFor(events) {
  const dates = events.flatMap((e) => [e.regEnd, e.contestStart, e.contestEnd]).filter(Boolean).sort();
  const newest = dates[dates.length - 1] || '2026-01-01';
  return ymd(newest) + 'T000000Z';
}

const lines = [];
const push = (l) => lines.push(fold(l));

push('BEGIN:VCALENDAR');
push('VERSION:2.0');
push('PRODID:-//CS Competition Calendar//ZH-CN');
push('CALSCALE:GREGORIAN');
push('METHOD:PUBLISH');
push('X-WR-CALNAME:CS 竞赛日历');
push('X-WR-CALDESC:计算机 / 人工智能 / 软件工程 / 信息安全竞赛的报名截止与开赛时间');
push('X-WR-TIMEZONE:Asia/Shanghai');
push('REFRESH-INTERVAL;VALUE=DURATION:PT12H');
push('X-PUBLISHED-TTL:PT12H');

const stamp = stampFor(EVENTS);
const items = [];

for (const e of EVENTS) {
  const name = e.short || e.title;
  const link = e.link || '';
  const desc = [e.summary || '', e.schoolNote ? '报名：' + e.schoolNote : '', link ? '详情：' + link : '']
    .filter(Boolean).join('\n');
  const expected = e.confidence === 'expected';

  if (e.regEnd) {
    items.push({
      sort: e.regEnd,
      uid: `${e.id}-reg@cs-competition-calendar`,
      summary: `报名截止：${name}${expected ? '（预计）' : ''}`,
      start: e.regEnd,
      end: nextDay(e.regEnd),
      desc,
      link,
      cat: e.cat
    });
  }
  if (e.contestStart) {
    const last = e.contestEnd && e.contestEnd > e.contestStart ? e.contestEnd : e.contestStart;
    items.push({
      sort: e.contestStart,
      uid: `${e.id}-contest@cs-competition-calendar`,
      summary: `开赛：${name}${expected ? '（预计）' : ''}`,
      start: e.contestStart,
      end: nextDay(last),
      desc,
      link,
      cat: e.cat
    });
  }
}

items.sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : a.summary < b.summary ? -1 : 1));

for (const it of items) {
  push('BEGIN:VEVENT');
  push(`UID:${it.uid}`);
  push(`DTSTAMP:${stamp}`);
  push(`DTSTART;VALUE=DATE:${ymd(it.start)}`);
  push(`DTEND;VALUE=DATE:${it.end}`);
  push(`SUMMARY:${escape(it.summary)}`);
  if (it.desc) push(`DESCRIPTION:${escape(it.desc)}`);
  if (it.link) push(`URL:${it.link}`);
  if (it.cat) push(`CATEGORIES:${escape(it.cat)}`);
  push(`TRANSP:TRANSPARENT`);
  push('BEGIN:VALARM');
  push('TRIGGER:-P1D');
  push('ACTION:DISPLAY');
  push(`DESCRIPTION:${escape(it.summary)}`);
  push('END:VALARM');
  push('END:VEVENT');
}

push('END:VCALENDAR');

const body = lines.join('\r\n') + '\r\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (prev === body) {
  console.log('无变化：' + items.length + ' 个日程');
} else {
  fs.writeFileSync(OUT, body, 'utf8');
  console.log('已写入 data/calendar.ics：' + items.length + ' 个日程，' + Buffer.byteLength(body) + ' 字节');
  console.log('sha256=' + crypto.createHash('sha256').update(body).digest('hex').slice(0, 12));
}
