#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit|NotebookEdit) — CLAUDE.md "파일 역할" 표를 강제한다.
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve, relative, sep, join } from 'node:path';
import { tmpdir } from 'node:os';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
// 진단용: 훅 입력에 에이전트 이름이 들어오는지 기록 (내용은 남기지 않음)
try { appendFileSync(join(tmpdir(), 'harness-guard.log'), `${new Date().toISOString()} write agent_type=${input.agent_type ?? '-'} keys=${Object.keys(input).join(',')}\n`); } catch {}
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const target = input.tool_input?.file_path || input.tool_input?.notebook_path;
const agent = input.agent_type || null; // 서브에이전트 안에서만 들어온다
if (!target) process.exit(0);
const rel = relative(root, resolve(root, target)).split(sep).join('/');
if (rel.startsWith('..')) process.exit(0); // 프로젝트 밖은 관여하지 않음

const decide = (permissionDecision, reason) => {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason } }));
  process.exit(0);
};

// 판정자는 아무것도 쓰지 않는다
if (agent === 'tes') decide('deny', '테스(판정자)는 읽기 전용이에요. 판정 결과는 메인 세션에 돌려주세요.');

// 사람 승인 파일
if (/^runs\/[^/]+\/p3-concept\/approval\.md$/.test(rel))
  decide('deny', 'approval.md는 대표만 만들어요. 대표에게 `! node harness/scripts/approve.mjs <slug>` 실행을 요청하세요.');

// 기준 문서·하네스 설정은 대표 확인을 받는다
if (/^docs\//.test(rel)) decide('ask', 'docs/는 대표만 고치는 기준 문서예요. 대표가 직접 요청한 수정인지 확인하세요.');
if (/^(harness\/|CLAUDE\.md$|\.claude\/(settings[^/]*\.json|hooks\/|agents\/|skills\/))/.test(rel))
  decide('ask', '하네스 규칙·설정 파일이에요. 대표 승인 후에만 고칠 수 있어요. (통과시키려고 rules.yaml 숫자를 바꾸면 안 돼요)');

// 실행 폴더: 단계 폴더마다 담당 에이전트 한 명
const m = rel.match(/^runs\/([^/]+)\/(.+)$/);
if (m) {
  const [, slug, sub] = m, folder = sub.split('/')[0];
  if (sub.startsWith('p1-research/references/manual/'))
    decide('deny', 'references/manual/은 대표가 직접 넣는 레퍼런스 폴더예요. 대표에게 넣어 달라고 요청하세요.');
  const OWNER = { 'p1-research': 'moa', 'p2-design-spec': 'haru', 'p3-concept': 'sora', 'p4-design': 'koda', 'p5-review': 'main' };
  const PHASE = { 'p1-research': 'p1', 'p2-design-spec': 'p2', 'p3-concept': 'p3', 'p4-design': 'p4' };
  // state.json, apify-dataset.json(Apify에서 직접 받은 원본)은 메인 세션만
  const owner = ['state.json', 'apify-dataset.json'].includes(sub) ? 'main' : OWNER[folder];
  if (!owner) decide('ask', `runs/<slug>/ 아래 정해지지 않은 위치예요: ${sub}`);
  if (agent) {
    if (agent === owner) process.exit(0);
    decide('deny', `${folder}은(는) ${owner === 'main' ? '메인 세션' : owner} 담당이에요. ${agent}는 자기 폴더만 편집할 수 있어요.`);
  }
  if (owner === 'main') process.exit(0);
  // 에이전트 이름이 안 넘어오는 환경: state.json의 현재 단계 폴더만 허용 (단계끼리 섞이지 않게)
  let phase = null;
  try { phase = JSON.parse(readFileSync(join(process.env.HARNESS_RUNS_ROOT || root, 'runs', slug, 'state.json'), 'utf8')).phase; } catch {}
  if (phase && PHASE[folder] === phase) process.exit(0);
  decide('deny', `지금 단계(${phase ?? '알 수 없음'})의 폴더가 아니에요. ${folder}은(는) ${owner} 담당이고 ${PHASE[folder]} 단계에서만 쓸 수 있어요.`);
}
process.exit(0);
