#!/usr/bin/env node
// P3 컨셉 승인 — 대표만 직접 실행한다: ! node harness/scripts/approve.mjs <slug> [--reject "사유"]
// 승인 시점의 key-*.html 해시를 기록해서, 승인 뒤 파일이 바뀌면 verify.mjs가 승인 무효로 판정한다.
import { writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { runDir, listFiles, sha256 } from './lib.mjs';

const [slug, flag, reason] = process.argv.slice(2);
const p3 = slug && join(runDir(slug), 'p3-concept');
if (!slug || !existsSync(p3)) { console.error('사용: node harness/scripts/approve.mjs <slug> [--reject "사유"]'); process.exit(3); }
const keys = listFiles(p3, p => /\/key-[^/]+\.html$/.test(p));
if (!keys.length) { console.error('p3-concept에 key-*.html이 없어요.'); process.exit(3); }

const reject = flag === '--reject';
const body = [
  `status: ${reject ? 'rejected' : 'approved'}`,
  reject ? `reason: ${reason || '(사유 없음)'}` : null,
  `at: ${new Date().toISOString()}`,
  'by: 대표',
  '',
  'hashes:',
  ...keys.map(p => `- ${basename(p)}: ${sha256(p)}`),
  '',
].filter(l => l !== null).join('\n');
writeFileSync(join(p3, 'approval.md'), body);
console.log(`${reject ? '반려' : '승인'} 기록: runs/${slug}/p3-concept/approval.md (키스크린 ${keys.length}개)`);
