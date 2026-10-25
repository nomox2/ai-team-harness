#!/usr/bin/env node
// 게이트·훅 회귀 테스트. 임시 폴더에 가짜 실행(runs/)을 만들어 판정이 기대대로인지 확인한다.
// 실제 runs/는 건드리지 않는다. 규칙은 이 저장소의 harness/rules.yaml을 그대로 쓴다.
// 사용: node harness/tests/run-tests.mjs
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, loadRules } from '../scripts/lib.mjs';
const MIN_REF = loadRules().p1.min_references;

const TMP = mkdtempSync(join(tmpdir(), 'harness-test-'));
const env = { ...process.env, HARNESS_RUNS_ROOT: TMP };
const script = name => join(ROOT, 'harness', 'scripts', name);
let n = 0, bad = 0;

function put(slug, path, text) { const p = join(TMP, 'runs', slug, path); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }
function run(slug, gate) {
  const r = spawnSync('node', [script('verify.mjs'), slug, gate], { env, encoding: 'utf8' });
  try { return JSON.parse(r.stdout); } catch { return { result: 'crash', checks: [{ id: r.stderr, ok: false }] }; }
}
const approve = (slug, ...args) => spawnSync('node', [script('approve.mjs'), slug, ...args], { env, encoding: 'utf8' });
function expect(label, out, result, failId) {
  n++;
  const failed = out.checks.filter(c => !c.ok).map(c => c.id);
  const ok = out.result === result && (!failId || failed.some(id => id.includes(failId)));
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${label}${ok ? '' : `  → ${out.result} [${failed.join(' | ')}]`}`);
}

/* ---------- 가짜 실행 만들기 ---------- */
let seq = 0;
function newRun() {
  const slug = 't' + (++seq);
  put(slug, 'state.json', JSON.stringify({ slug, screens: [], phase: 'p1', gates: {}, failures: {}, log: [] }));
  return slug;
}
function p1(slug, { manual = Math.max(MIN_REF, 3), evidence = 'references/manual/m1.png' } = {}) {
  for (let i = 1; i <= manual; i++) put(slug, `p1-research/references/manual/m${i}.png`, 'x');
  put(slug, 'p1-research/analysis.md', `## 레퍼런스 요약\n-\n## 반영할 점\n- 하나 (근거: references/manual/m1.png)\n- 둘 (근거: references/manual/m2.png)\n- 셋 (근거: ${evidence})\n## 이번 화면에 주는 제안\n`);
}
const UI = loadRules().uibowl;
const autoMd = ({ url = UI.url_prefix + '/screen/1', app = '토스', screen = '내역' } = {}) => [url && `url: ${url}`, app && `app: ${app}`, screen && `screen: ${screen}`].filter(Boolean).join('\n') + '\n';

const CSS = `body{margin:0;font-family:Pretendard, Inter, sans-serif;color:#171717;background:#ffffff}
.record-item{border-bottom:1px solid #ededed;min-height:56px}
.budget-left{background:#fafafa;border-radius:12px;padding:16px}
.amount{font-family:Inter, sans-serif}
button,.btn{min-height:44px;border-radius:6px}
.btn-primary{background:#3ecf8e;color:#171717}
.tag{border-radius:9999px}`;
const rec = ({ kind = 'expense', amount = '−4,500원', category = '카페', date = '10월 24일', omit = '' } = {}) =>
  `<li class="record-item" data-kind="${kind}">${omit === 'category' ? '' : `<span class="category">${category}</span>`}` +
  `${omit === 'date' ? '' : `<span class="date">${date}</span>`}${omit === 'amount' ? '' : `<span class="amount">${amount}</span>`}</li>`;
const budget = (amount = '328,000원') => `<section class="budget-left"><span class="label">남은 예산</span><span class="amount">${amount}</span></section>`;
const nav = '<a class="btn" data-nav="record" href="#">기록</a>';
const list = (...items) => `<ul>${items.join('')}</ul>`;
const homeBody = ({ b = budget(), items = list(rec(), rec({ kind: 'income', amount: '+2,500,000원', category: '월급' })), n = nav } = {}) =>
  b + items + n + '<button class="btn-primary">저장</button>';
const page = ({ frame = '390x844', css = CSS, head = '', body = homeBody() } = {}) =>
  `<!doctype html><html lang="ko"${frame ? ` data-frame="${frame}"` : ''}><head>${head}<style>${css}</style></head><body>${body}</body></html>`;

/* ---------- P1 ---------- */
let s;
s = newRun(); p1(s); expect(`P1 · 직접 넣은 레퍼런스 ${Math.max(MIN_REF, 3)}개 → 통과`, run(s, 'p1'), 'pass');
s = newRun(); p1(s, { manual: MIN_REF - 1 }); expect(`P1 · 레퍼런스 ${MIN_REF - 1}개 → 실패`, run(s, 'p1'), 'fail', '레퍼런스 수');
s = newRun(); p1(s, { evidence: 'references/manual/zzz.png' }); expect('P1 · 없는 근거 파일 → 실패', run(s, 'p1'), 'fail', '근거');
s = newRun(); p1(s, { evidence: 'references/manual/스크린샷 2026-10-20 오후 11.28.21.png' }); put(s, 'p1-research/references/manual/스크린샷 2026-10-20 오후 11.28.21.png', 'x');
expect('P1 · 공백 있는 파일 이름 근거 → 통과', run(s, 'p1'), 'pass');
s = newRun(); p1(s, { evidence: '`references/manual/내 캡처 1.png`' }); put(s, 'p1-research/references/manual/내 캡처 1.png', 'x');
expect('P1 · 백틱으로 감싼 공백 경로 → 통과', run(s, 'p1'), 'pass');
s = newRun(); p1(s, { evidence: 'references/manual/없는 캡처 2.png' }); expect('P1 · 공백 있는 없는 파일 → 실패', run(s, 'p1'), 'fail', '근거');
s = newRun(); p1(s); put(s, 'p1-research/references/auto/01-toss.md', autoMd()); expect('P1 · 유아이볼 auto 항목 정상 → 통과', run(s, 'p1'), 'pass');
s = newRun(); p1(s); put(s, 'p1-research/references/auto/01-toss.md', autoMd({ url: UI.url_prefix + '/name/a?x=1&amp;y=2' })); expect('P1 · auto url에 &amp; → 실패', run(s, 'p1'), 'fail', '주소 글자');
s = newRun(); p1(s); put(s, 'p1-research/references/auto/01-toss.md', autoMd({ url: UI.url_prefix + '/name/a?x=1&y=2' })); expect('P1 · auto url에 & → 통과', run(s, 'p1'), 'pass');
s = newRun(); p1(s); put(s, 'p1-research/references/auto/01-toss.md', autoMd({ app: '' })); expect('P1 · auto에 app 줄 없음 → 실패', run(s, 'p1'), 'fail', '필수 줄');
s = newRun(); p1(s); put(s, 'p1-research/references/auto/01-toss.md', autoMd({ url: 'https://example.com/a' })); expect('P1 · auto url이 유아이볼이 아님 → 실패', run(s, 'p1'), 'fail', '유아이볼 주소');
s = newRun(); p1(s, { manual: 0 }); for (let i = 1; i <= UI.max_items_per_run + 1; i++) put(s, `p1-research/references/auto/${i}.md`, autoMd());
expect('P1 · auto가 한도 초과 → 실패', run(s, 'p1'), 'fail', '유아이볼 한도');
s = newRun(); p1(s, { evidence: 'references/manual/003.avif' }); put(s, 'p1-research/references/manual/003.avif', 'x');
expect('P1 · avif 근거 파일 → 통과', run(s, 'p1'), 'pass');
s = newRun(); p1(s, { manual: MIN_REF - 1 }); put(s, 'p1-research/references/manual/.DS_Store', 'x');
expect('P1 · 숨김 파일(.DS_Store)은 레퍼런스로 안 셈 → 실패', run(s, 'p1'), 'fail', '레퍼런스 수');

/* ---------- P2: 만들 화면은 하루가 정한다 ---------- */
const P2 = loadRules().p2;
const sec = (name, key, n = 3) => `## ${name}\n${key === null ? '' : `파일: ${key}\n`}${Array.from({ length: n }, (_, i) => `- 요소 ${i + 1}\n`).join('')}`;
const spec = sec('홈', 'home');
s = newRun(); put(s, 'p2-design-spec/screens.md', spec); expect('P2 · 화면 1개 설계 → 통과', run(s, 'p2'), 'pass');
s = newRun(); put(s, 'p2-design-spec/screens.md', spec + sec('마이페이지', 'my-page')); expect('P2 · 하루가 정한 새 화면 → 통과', run(s, 'p2'), 'pass');
s = newRun(); put(s, 'p2-design-spec/screens.md', '## 화면을 이렇게 정한 이유\n시나리오 1에 필요한 화면부터 만든다.\n' + spec + '## 다음에 만들 화면\n통계는 다음 실행에서.\n');
expect('P2 · 정한 이유·다음 화면 섹션은 화면으로 안 셈 → 통과', run(s, 'p2'), 'pass');
s = newRun(); expect('P2 · screens.md 없음 → 실패', run(s, 'p2'), 'fail', 'screens.md');
s = newRun(); put(s, 'p2-design-spec/screens.md', sec('홈', 'home', 1)); expect('P2 · 요소 부족 → 실패', run(s, 'p2'), 'fail', '홈 · 설계');
s = newRun(); put(s, 'p2-design-spec/screens.md', sec('홈', null)); expect('P2 · 파일 이름 줄 없음 → 실패', run(s, 'p2'), 'fail', '홈 · 파일 이름');
s = newRun(); put(s, 'p2-design-spec/screens.md', sec('홈', 'Home 화면')); expect('P2 · 파일 이름에 한글·대문자 → 실패', run(s, 'p2'), 'fail', '홈 · 파일 이름');
s = newRun(); put(s, 'p2-design-spec/screens.md', spec + sec('메인', 'home')); expect('P2 · 파일 이름 겹침 → 실패', run(s, 'p2'), 'fail', '파일 이름 겹침');
s = newRun(); put(s, 'p2-design-spec/screens.md', Array.from({ length: P2.max_screens + 1 }, (_, i) => sec(`화면${i}`, `s${i}`)).join(''));
expect('P2 · 화면 수 상한 초과 → 실패', run(s, 'p2'), 'fail', '화면 수');

/* ---------- P3 ---------- */
const p3 = (html, two = true) => { const x = newRun(); put(x, 'p3-concept/key-a.html', html); if (two) put(x, 'p3-concept/key-b.html', page()); return x; };
expect('P3 · 키스크린 1개 → 실패', run(p3(page(), false), 'p3'), 'fail', '키스크린 수');
expect('P3 · 키스크린 2개 정상 → 통과', run(p3(page()), 'p3'), 'pass');
expect('P3 · Pretendard 웹폰트 링크 → 통과', run(p3(page({ head: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">' })), 'p3'), 'pass');
const broken = [
  ['기준 화면 없음', page({ frame: '' }), '기준 화면'],
  ['팔레트 밖 색', page({ css: CSS + '.x{color:#333}' }), '· 색'],
  ['빨간 그림자 rgba', page({ css: CSS + '.x{box-shadow:0 1px 2px rgba(255,0,0,.2)}' }), 'rgba/hsl'],
  ['모서리 10px', page({ css: CSS + '.x{border-radius:10px}' }), '모서리'],
  ['Roboto 폰트', page({ css: CSS + '.x{font-family:Roboto}' }), '폰트'],
  ['초록을 배지에', page({ css: CSS + '.tag{background:#3ecf8e}' }), '초록은 채움 버튼에만'],
  ['채움 버튼 2개', page({ body: homeBody() + '<button class="btn-primary">a</button><button class="btn-primary">b</button>' }), '채움 버튼 수'],
  ['36px 버튼', page({ css: CSS + '.btn{height:36px}' }), '터치 영역'],
  ['버튼 높이 규칙 없음', page({ css: CSS.replace('button,.btn{min-height:44px;border-radius:6px}', '') }), '버튼 높이 규칙'],
  ['script 태그', page({ body: homeBody() + '<script>1</script>' }), 'script'],
  ['외부 이미지', page({ body: homeBody() + '<img src="https://example.com/a.png" alt="">' }), '외부 리소스'],
  ['이름 색 red', page({ css: CSS + '.x{color:red}' }), '이름 색'],
];
for (const [label, html, id] of broken) expect(`P3 · ${label} → 실패`, run(p3(html), 'p3'), 'fail', id);

/* ---------- 승인 ---------- */
s = p3(page());
expect('승인 · 승인 전 → 대기', run(s, 'approval'), 'wait');
approve(s); expect('승인 · 승인 후 → 통과', run(s, 'approval'), 'pass');
appendFileSync(join(TMP, 'runs', s, 'p3-concept', 'key-b.html'), '<!-- 승인 뒤 수정 -->');
expect('승인 · 승인 뒤 시안 수정 → 실패(무효)', run(s, 'approval'), 'fail', '승인 뒤 변경 없음');
approve(s, '--reject', '톤이 어두움'); expect('승인 · 반려 → 실패', run(s, 'approval'), 'fail', '승인');

/* ---------- P4 · P5 ---------- */
function p45(screenHtml, { approved = true, screen = '홈', file = 'home', spec = true } = {}) {
  const x = p3(page(), true);
  if (spec) put(x, 'p2-design-spec/screens.md', sec(screen, file));
  if (approved) approve(x);
  put(x, 'p4-design/tokens.md', '# tokens\n');
  put(x, `p4-design/screens/${file}.html`, screenHtml);
  return x;
}
const h = o => page({ body: homeBody(o) });
expect('P4 · 승인 없음 → 오류', run(p45(page(), { approved: false }), 'p4'), 'error');
expect('P4 · 정상 → 통과', run(p45(page()), 'p4'), 'pass');
expect('P4 · P2 설계 없음 → 오류', run(p45(page(), { spec: false }), 'p4'), 'error', 'screens.md');
s = p45(page()); put(s, 'p2-design-spec/screens.md', spec + sec('통계', 'stats'));
expect('P4 · 설계한 화면의 파일 없음 → 실패', run(s, 'p4'), 'fail', '통계 · 화면');
expect('P5 · 정상 → 통과', run(p45(page()), 'p5'), 'pass');
expect('P5 · 기록에 금액 없음 → 실패', run(p45(h({ items: list(rec({ omit: 'amount' })) })), 'p5'), 'fail', '금액');
expect('P5 · 기록에 카테고리 없음 → 실패', run(p45(h({ items: list(rec({ omit: 'category' })) })), 'p5'), 'fail', '카테고리');
expect('P5 · 기록에 날짜 없음 → 실패', run(p45(h({ items: list(rec({ omit: 'date' })) })), 'p5'), 'fail', '날짜');
expect('P5 · 날짜 묶음 제목만 있고 항목엔 없음 → 실패', run(p45(h({ items: '<h4>10월 24일</h4>' + list(rec({ omit: 'date' })) })), 'p5'), 'fail', '날짜');
expect('P5 · 수입에 + 기호 없음 → 실패', run(p45(h({ items: list(rec({ kind: 'income', amount: '2,500,000원' })) })), 'p5'), 'fail', '수입·지출 구분');
expect('P5 · 지출에 − 기호 없음 → 실패', run(p45(h({ items: list(rec({ amount: '4,500원' })) })), 'p5'), 'fail', '수입·지출 구분');
expect('P5 · 지출에 하이픈(-) 기호 → 통과', run(p45(h({ items: list(rec({ amount: '-4,500원' })) })), 'p5'), 'pass');
expect('P5 · 홈에 남은 예산 없음 → 실패', run(p45(h({ b: '' })), 'p5'), 'fail', '남은 예산');
expect('P5 · 남은 예산에 숫자 없음 → 실패', run(p45(h({ b: budget('확인 중') })), 'p5'), 'fail', '남은 예산');
expect('P5 · 기록하기로 가는 길 없음 → 실패', run(p45(h({ n: '' })), 'p5'), 'fail', '기록하기로 가는 길');
expect('P5 · 기록하기 화면은 가는 길 없어도 통과', run(p45(h({ b: '', n: '' }), { screen: '기록하기', file: 'record' }), 'p5'), 'pass');
expect('P5 · 내역 화면에는 남은 예산 없어도 통과', run(p45(h({ b: '' }), { screen: '내역', file: 'history' }), 'p5'), 'pass');

/* ---------- 훅 ---------- */
const hook = name => join(ROOT, '.claude', 'hooks', name);
const W = hook('guard-write.mjs'), B = hook('guard-bash.mjs');
const APPROVE = 'node harness/scripts/' + 'approve' + '.mjs s';
const hookCases = [
  [W, { file_path: 'runs/s/p1-research/analysis.md' }, 'moa', '모아 → p1', 'allow'],
  [W, { file_path: 'runs/s/p3-concept/key-a.html' }, 'moa', '모아 → p3', 'deny'],
  [W, { file_path: 'runs/s/p3-concept/key-a.html' }, 'sora', '소라 → p3', 'allow'],
  [W, { file_path: 'runs/s/p4-design/screens/home.html' }, 'koda', '코다 → p4', 'allow'],
  [W, { file_path: 'runs/s/p3-concept/approval.md' }, 'sora', '소라 → approval.md', 'deny'],
  [W, { file_path: 'runs/s/p3-concept/approval.md' }, null, '메인 → approval.md', 'deny'],
  [W, { file_path: 'runs/s/state.json' }, 'tes', '테스 → 쓰기', 'deny'],
  [W, { file_path: 'runs/s/state.json' }, null, '메인 → state.json', 'allow'],
  [W, { file_path: 'runs/s/apify-dataset.json' }, null, '메인 → apify-dataset.json', 'allow'],
  [W, { file_path: 'runs/s/apify-dataset.json' }, 'moa', '모아 → apify-dataset.json', 'deny'],
  [W, { file_path: 'runs/s/p5-review/review.md' }, null, '메인 → review.md', 'allow'],
  [W, { file_path: 'runs/s/p4-design/screens/home.html' }, null, '이름 없음 → 다른 단계(p4) 폴더', 'deny'],
  [W, { file_path: 'runs/s/p1-research/analysis.md' }, null, '이름 없음 → 현재 단계(p1) 폴더', 'allow'],
  [W, { file_path: 'runs/s/p3-concept/approval.md' }, null, '이름 없음 → approval.md', 'deny'],
  [W, { file_path: 'runs/s/p1-research/references/manual/a.png' }, null, '메인 → references/manual', 'deny'],
  [W, { file_path: 'docs/prd.md' }, null, '메인 → docs/', 'ask'],
  [W, { file_path: 'harness/rules.yaml' }, null, '메인 → rules.yaml', 'ask'],
  [W, { file_path: 'office.html' }, null, '메인 → office.html', 'allow'],
  [B, { command: 'node harness/scripts/verify.mjs s p5' }, 'tes', '테스 → verify', 'allow'],
  [B, { command: 'ls runs' }, 'tes', '테스 → ls', 'deny'],
  [B, { command: APPROVE }, null, '메인 → 승인 스크립트', 'deny'],
  [B, { command: 'echo status: approved > runs/s/p3-concept/approval.md' }, null, '메인 → echo > approval.md', 'deny'],
  [B, { command: 'cat runs/s/p3-concept/approval.md' }, null, '메인 → cat approval.md', 'allow'],
  [B, { command: 'echo x > runs/s/p4-design/a.html' }, null, '메인 → echo > p4', 'deny'],
  [B, { command: 'mkdir -p runs/s/p1-research/references/manual' }, null, '메인 → mkdir', 'allow'],
  [B, { command: "sed -i '' s/3/1/ harness/rules.yaml" }, null, '메인 → sed rules.yaml', 'ask'],
];
put('s', 'state.json', JSON.stringify({ slug: 's', screens: ['홈'], phase: 'p1' })); // 이름 없는 쓰기는 현재 단계로 판단
for (const [h, tool_input, agent, label, want] of hookCases) {
  const r = spawnSync('node', [h], { input: JSON.stringify({ tool_input, ...(agent && { agent_type: agent }) }), env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, HARNESS_RUNS_ROOT: TMP }, encoding: 'utf8' });
  const got = r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : 'allow';
  n++; if (got !== want) bad++;
  console.log(`${got === want ? '✓' : '✗'} 훅 · ${label} → ${got}${got === want ? '' : ` (기대: ${want})`}`);
}

rmSync(TMP, { recursive: true, force: true });
console.log(`\n${n - bad}/${n} 통과`);
process.exit(bad ? 1 : 0);
