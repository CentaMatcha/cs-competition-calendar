import fs from 'node:fs';

const file = process.env.FEED_PATH || 'data/feed.latest.json';
const threshold = Number(process.env.STALE_DAYS || 180);

function fail(msg) {
  console.error(`::error file=${file}::${msg}`);
  process.exit(1);
}

let feed;
try {
  feed = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
} catch (err) {
  fail(`无法解析 JSON：${err.message}`);
}

const raw = String(feed.updatedAt || '');
if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
  fail(`updatedAt 缺失或格式不对（应为 YYYY-MM-DD），当前值：${JSON.stringify(feed.updatedAt)}`);
}

const updated = Date.parse(raw + 'T00:00:00Z');
if (Number.isNaN(updated)) fail(`updatedAt 不是有效日期：${raw}`);

const days = Math.floor((Date.now() - updated) / 86400000);
const stale = days > threshold;
const eventCount = Array.isArray(feed.events) ? feed.events.length : 0;
const removeCount = Array.isArray(feed.remove) ? feed.remove.length : 0;

console.log(`updatedAt=${raw}，距今 ${days} 天，阈值 ${threshold} 天 → ${stale ? '已过期' : '正常'}`);
console.log(`version=${feed.version || '(缺失)'}，events=${eventCount}，remove=${removeCount}`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `days=${days}\nupdated=${raw}\nstale=${stale}\nevents=${eventCount}\n`);
}
