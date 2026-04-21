#!/usr/bin/env node
// sync-assets.mjs
// 01_Character, 11_SchoolIcon 원본 폴더에서 필요한 이미지만 필터링하여
// CharacterPortrait, SchoolIcon 폴더로 복사 (prefix 제거 + 소문자 변환)
//
// 사용: node sync-assets.mjs [--concurrency=N]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
process.chdir(scriptDir);

// 동시 복사 개수: 인자 --concurrency=N 또는 env SYNC_JOBS, 기본 32
const argConc = process.argv.find(a => a.startsWith('--concurrency='));
const CONCURRENCY = Number(
  (argConc && argConc.split('=')[1]) || process.env.SYNC_JOBS || 32
) || 32;

// ── 포함할 NPC 허용 목록 (NPC_Portrait_ 뒤 부분, 대소문자 무시, 확장자 제외)
// 글롭 패턴(*, ?) 사용 가능. 예: Kaitenranger_*
const NPC_ALLOW = [
  'Arona',
  'Blacksuit',
  'Kaitenranger_*',
  'Maestro',
  'Momoka',
  'NP0009', 'NP0011_1', 'NP0011_2', 'NP0013', 'NP0014', 'NP0015',
  'NP0029', 'NP0030', 'NP0032', 'NP0033', 'NP0035', 'NP0037', 'NP0038',
  'NP0040', 'NP0076', 'NP0079', 'NP0090', 'NP0095',
  'NP0097', 'NP0098', 'NP0099', 'NP0101', 'NP0102',
  'NP0108', 'NP0109', 'NP0110', 'NP0111', 'NP0112', 'NP0113', 'NP0114',
  'NP0115_1', 'NP0115_2', 'NP0118',
  'NP0129', 'NP0130', 'NP0131',
  'NP0147', 'NP0148',
  'NP0161', 'NP0165', 'NP0171', 'NP0172', 'NP0173',
  'NP0217', 'NP0218', 'NP0219', 'NP0220', 'NP0221', 'NP0222', 'NP0223',
  'NP0225', 'NP0226', 'NP0227', 'NP0228',
  'NP0232', 'NP0233', 'NP0234', 'NP0235', 'NP0236', 'NP0237',
  'NP0240', 'NP0241',
  'NP0267', 'NP0268', 'NP0269', 'NP0274',
  'Peroro',
  'Rin',
  'Shibasekimaster',
  'Sora',
];

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

const NPC_ALLOW_RE = NPC_ALLOW.map(globToRegex);

function isNpcAllowed(name) {
  const stem = name.replace(/^NPC_Portrait_/, '').replace(/\.[^.]+$/, '');
  return NPC_ALLOW_RE.some(re => re.test(stem));
}

// ── 진행률 바 ─────────────────────────────────────────────────────
const BAR_WIDTH = 30;
function drawProgress(current, total, label) {
  const percent = total > 0 ? Math.floor((current * 100) / total) : 0;
  const filled = total > 0 ? Math.floor((current * BAR_WIDTH) / total) : 0;
  const empty = BAR_WIDTH - filled;
  const bar = '#'.repeat(filled) + '-'.repeat(empty);
  process.stdout.write(
    `\r${label.padEnd(18)} [${bar}] ${String(percent).padStart(3)}% (${current}/${total})`
  );
}
function clearLine() { process.stdout.write('\r\x1b[K'); }

// ── 동시성 제한 복사 ─────────────────────────────────────────────
async function copyAllConcurrent(tasks, label) {
  const total = tasks.length;
  let done = 0;
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      const { src, dst } = tasks[i];
      await fs.promises.copyFile(src, dst);
      done++;
      drawProgress(done, total, label);
    }
  }
  const n = Math.min(CONCURRENCY, Math.max(1, tasks.length));
  await Promise.all(Array.from({ length: n }, worker));
}

// ── 디렉토리별 동기화 ────────────────────────────────────────────
async function syncDir({ src, dst, label, shouldInclude, rename }) {
  if (!fs.existsSync(src)) {
    console.error(`ERROR: ${src} 폴더가 없습니다.`);
    process.exit(1);
  }
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });

  const all = fs.readdirSync(src);
  const tasks = [];
  for (const name of all) {
    if (!shouldInclude(name)) continue;
    const newname = rename(name);
    tasks.push({ src: path.join(src, name), dst: path.join(dst, newname) });
  }

  if (tasks.length === 0) {
    console.log(`${label}: 0개 복사 완료 (스캔 ${all.length}개)`);
    return;
  }

  await copyAllConcurrent(tasks, label);
  clearLine();
  console.log(`${label}: ${tasks.length}개 복사 완료 (스캔 ${all.length}개)`);
}

// ── 01_Character → CharacterPortrait ──────────────────────────────
function includeChar(name) {
  if (name.endsWith('.meta')) return false;
  if (name.startsWith('NPC_Portrait_')) {
    if (!isNpcAllowed(name)) return false;
  }
  if (name.endsWith('_Small.png')) return false;
  if (name.endsWith('_Nobody.png')) return false;
  if (name.endsWith('_Error.png')) return false;
  return true;
}
function renameChar(name) {
  let n = name;
  if (n.startsWith('Student_Portrait_')) n = n.slice('Student_Portrait_'.length);
  if (n.startsWith('NPC_Portrait_')) n = n.slice('NPC_Portrait_'.length);
  return n.toLowerCase();
}

// ── 11_SchoolIcon → SchoolIcon ────────────────────────────────────
function includeSchool(name) {
  return !name.endsWith('.meta');
}
function renameSchool(name) {
  let n = name;
  if (n.startsWith('School_Icon_')) n = n.slice('School_Icon_'.length);
  return n.toLowerCase();
}

// ── 실행 ─────────────────────────────────────────────────────────
const t0 = Date.now();
await syncDir({
  src: '01_Character', dst: 'CharacterPortrait', label: 'CharacterPortrait',
  shouldInclude: includeChar, rename: renameChar,
});
await syncDir({
  src: '11_SchoolIcon', dst: 'SchoolIcon', label: 'SchoolIcon',
  shouldInclude: includeSchool, rename: renameSchool,
});
const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`완료! (${elapsed}s, concurrency=${CONCURRENCY})`);
