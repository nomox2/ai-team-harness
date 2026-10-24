#!/usr/bin/env node
// 게이트 판정 스크립트. 파일을 읽기만 하고 아무것도 쓰지 않는다.
// 사용: node harness/scripts/verify.mjs <slug> <p1|p2|p3|approval|p4|p5>
// 종료 코드: 0 통과 · 1 실패 · 2 대기 · 3 오류
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import {
  RUNS_ROOT, NAMED_COLORS, loadRules, parseHtml, cssOf, cssRules, findAll, hasClass, textOf,
  runDir, listFiles, sha256, readJson,
} from './lib.mjs';

const [slug, gate] = process.argv.slice(2);
const R = loadRules();
const dir = slug && runDir(slug);
const checks = [];
const check = (id, ok, detail = '') => checks.push({ id, ok: !!ok, detail });
const rel = p => relative(RUNS_ROOT, p);

function finish(result, extra = {}) {
  const out = { slug, gate, result, ...extra, checks };
  if (result === 'fail') out.return_to = R.gates.return_to[gate];
  console.log(JSON.stringify(out, null, 2));
  process.exit({ pass: 0, fail: 1, wait: 2, error: 3 }[result]);
}
const verdict = () => finish(checks.every(c => c.ok) ? 'pass' : 'fail');

if (!slug || !R.gates.order.includes(gate)) {
  check('usage', false, 'node harness/scripts/verify.mjs <slug> <' + R.gates.order.join('|') + '>');
  finish('error');
}
if (!existsSync(join(dir, 'state.json'))) { check('state', false, `${rel(dir)}/state.json 이 없음`); finish('error'); }
const state = readJson(join(dir, 'state.json'));
const chosen = state.screens || [];
// "아직 미정" 실행: 화면 없이 리서치만 한다 (rules.yaml explore)
const explore = chosen.includes(R.explore.screen);
if (explore && chosen.length > 1) { check('state.screens', false, `"${R.explore.screen}"은 다른 화면과 함께 고를 수 없음`); finish('error'); }
if (explore && !R.explore.gates.includes(gate)) { check('미정 실행', false, `"${R.explore.screen}" 실행은 ${R.explore.gates.join(', ')}만 판정함 — 화면을 정한 뒤 새 실행으로 이어가야 함`); finish('error'); }
const bad = chosen.filter(s => !(s in R.screens) && !(explore && s === R.explore.screen));
if (!chosen.length || bad.length) { check('state.screens', false, `고른 화면이 비었거나 PRD에 없는 화면: ${bad.join(', ')}`); finish('error'); }

/* ---------- 디자인 규칙 (design.md → rules.yaml.style) ---------- */
const norm = h => { h = h.toLowerCase(); return h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h; };
const S = R.style;
const palette = new Set(S.colors.map(norm));
const fonts = new Set(S.fonts.map(f => f.toLowerCase()));
const greens = new Set(S.green_colors.map(norm));
const INTERACTIVE = /(^|[\s,>+~(])(button|a|input|select)(?![\w-])|\.btn|\[role=["']?button|\.tab(?![\w-])|\.chip(?![\w-])/;

function styleChecks(file) {
  const name = rel(file);
  const html = readFileSync(file, 'utf8');
  const tree = parseHtml(html);
  const root = findAll(tree, n => n.tag === 'html')[0];
  check(`${name} · 기준 화면`, root?.attrs['data-frame'] === R.frame.attr,
    `<html data-frame="${R.frame.attr}"> 필요 (지금: ${root?.attrs['data-frame'] ?? '없음'})`);

  const css = cssOf(html, tree);
  const svgColors = findAll(tree, n => n.attrs.fill || n.attrs.stroke).flatMap(n => [n.attrs.fill, n.attrs.stroke]).filter(Boolean).join(' ');
  const hexes = [...(css + ' ' + svgColors).matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map(m => norm(m[0]));
  const offPalette = [...new Set(hexes.filter(h => !palette.has(h)))];
  check(`${name} · 색`, !offPalette.length, offPalette.length ? `팔레트 밖 색: ${offPalette.join(', ')}` : '');

  const funcs = [...css.matchAll(/\b(rgba?|hsla?)\(([^)]*)\)/g)];
  const badFunc = funcs.filter(([, f, a]) => !(S.rgba_only_black && f.startsWith('rgb') && /^\s*0\s*,\s*0\s*,\s*0\s*(,|$)/.test(a)));
  check(`${name} · rgba/hsl`, !badFunc.length, badFunc.length ? `그림자용 rgba(0,0,0,…) 외 색 함수: ${badFunc.map(m => m[0]).join(', ')}` : '');

  const rules = cssRules(css);
  const radii = rules.flatMap(r => [...r.decls.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;]+)/g)].flatMap(m => m[1].split(/[\s/]+/)))
    .filter(v => v && v !== '0');
  const badR = [...new Set(radii.filter(v => { const m = v.match(/^(\d+(?:\.\d+)?)px$/); return !m || !S.radius_px.includes(Number(m[1])); }))];
  check(`${name} · 모서리`, !badR.length, badR.length ? `허용(${S.radius_px.join('/')}px) 밖 값: ${badR.join(', ')}` : '');

  const fams = rules.flatMap(r => [...r.decls.matchAll(/font-family\s*:\s*([^;]+)/g)].flatMap(m => m[1].split(',')))
    .map(f => f.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  const badF = [...new Set(fams.filter(f => !fonts.has(f.toLowerCase())))];
  check(`${name} · 폰트`, !badF.length, badF.length ? `허용 밖 폰트: ${badF.join(', ')}` : '');

  const greenMisuse = rules.filter(r => !r.selector.includes('btn-primary') &&
    [...r.decls.matchAll(/background(?:-color)?\s*:\s*([^;]+)/g)].some(m => [...m[1].matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].some(h => greens.has(norm(h[0])))));
  check(`${name} · 초록은 채움 버튼에만`, !greenMisuse.length, greenMisuse.map(r => r.selector).join(', '));
  const primaries = findAll(tree, n => hasClass(n, 'btn-primary')).length;
  check(`${name} · 채움 버튼 수`, primaries <= S.max_primary_buttons, `.btn-primary ${primaries}개 (최대 ${S.max_primary_buttons})`);

  const small = rules.filter(r => INTERACTIVE.test(r.selector)).flatMap(r =>
    [...r.decls.matchAll(/(?:^|;|\s)(min-height|height)\s*:\s*(\d+(?:\.\d+)?)px/g)].filter(m => Number(m[2]) < S.touch_min_px).map(m => `${r.selector} { ${m[1]}: ${m[2]}px }`));
  check(`${name} · script 없음`, S.allow_script || !findAll(tree, n => n.tag === 'script').length, '<script>는 쓰지 않는다');
  const refs = [
    ...findAll(tree, n => n.attrs.href && n.tag === 'link').map(n => n.attrs.href),
    ...findAll(tree, n => n.attrs.src).map(n => n.attrs.src),
    ...[...css.matchAll(/url\(\s*["']?([^"')\s]+)/g)].map(m => m[1]),
    ...[...css.matchAll(/@import\s+["']([^"']+)/g)].map(m => m[1]),
  ];
  const external = [...new Set(refs.filter(u => /^(https?:)?\/\//.test(u) && !S.external_allow.some(a => u.startsWith(a))))];
  check(`${name} · 외부 리소스`, !external.length, external.length ? `허용 밖 외부 주소: ${external.join(', ')}` : '');
  if (S.no_named_colors) {
    const COLOR_PROP = /^(color|background(-color)?|border(-[a-z]+)*(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|text-decoration(-color)?|caret-color|column-rule(-color)?|accent-color)$/;
    const vals = rules.flatMap(r => r.decls.split(';').map(d => d.split(':')).filter(([k, v]) => v && COLOR_PROP.test(k.trim().toLowerCase())).map(([, v]) => v))
      .concat(findAll(tree, n => n.attrs.fill || n.attrs.stroke).flatMap(n => [n.attrs.fill || '', n.attrs.stroke || '']));
    const named = [...new Set(vals.flatMap(v => v.replace(/url\([^)]*\)|var\([^)]*\)/g, '').toLowerCase().match(/[a-z]+/g) || []).filter(w => NAMED_COLORS.has(w)))];
    check(`${name} · 이름 색`, !named.length, named.length ? `이름 색 금지: ${named.join(', ')}` : '');
  }

  check(`${name} · 터치 영역`, !small.length, small.length ? `${S.touch_min_px}px 미만: ${small.join(' / ')}` : '');
  const hasButtons = findAll(tree, n => n.tag === 'button' || hasClass(n, 'btn-primary')).length > 0;
  const tall = rules.some(r => /(^|[\s,>+~])button(?![\w-])|\.btn/.test(r.selector) &&
    [...r.decls.matchAll(/(min-height|height)\s*:\s*(\d+(?:\.\d+)?)px/g)].some(m => Number(m[2]) >= S.touch_min_px));
  check(`${name} · 버튼 높이 규칙`, !hasButtons || tall, `버튼이 있으면 button/.btn 규칙에 min-height ${S.touch_min_px}px 이상 필요`);
  return { tree, rules };
}

/* ---------- 서비스 조건 (story-service.md → rules.yaml.service) ---------- */
function serviceChecks(file, { tree }, screenSlug) {
  const name = rel(file);
  const V = R.service;
  const label = (c, cls) => textOf(findAll(c, n => hasClass(n, cls))[0] || { children: [] }).trim();
  // 어기면 안 되는 것 1: 기록 항목마다 금액·카테고리·날짜
  const records = findAll(tree, n => hasClass(n, 'record-item'));
  records.forEach((r, i) => {
    const id = `${name} · 기록 ${i + 1}`;
    for (const cls of V.record_requires) {
      const kor = { amount: '금액', category: '카테고리', date: '날짜' }[cls] || cls;
      check(`${id} · ${kor}`, label(r, cls), `내용이 있는 .${cls} 요소 필요`);
    }
    // 일반 규칙: 수입·지출은 색만이 아니라 기호(+/−)로 구분
    const kind = r.attrs['data-kind'], amount = label(r, 'amount');
    const signs = V.kinds[kind];
    check(`${id} · 수입·지출 구분`, signs && signs.some(sg => amount.startsWith(sg)),
      `data-kind(${Object.keys(V.kinds).join('|')})와 맞는 기호(${(signs || []).join(' 또는 ') || '?'})로 시작하는 .amount 필요 (지금: ${kind ?? '없음'} / "${amount}")`);
  });
  // 어기면 안 되는 것 2: 홈에는 이번 달 남은 예산
  if (V.budget_left.screens.includes(screenSlug)) {
    const b = findAll(tree, n => hasClass(n, 'budget-left'))[0];
    check(`${name} · 남은 예산`, b && /\d/.test(label(b, 'amount')), '.budget-left 안에 숫자가 있는 .amount 필요');
  }
  // 일반 규칙: 어느 화면에서든 기록하기로 한 번에
  if (!V.record_nav.exempt_screens.includes(screenSlug))
    check(`${name} · 기록하기로 가는 길`, findAll(tree, n => n.attrs['data-nav'] === V.record_nav.attr).length,
      `data-nav="${V.record_nav.attr}" 요소 필요`);
}

/* ---------- 승인 ---------- */
function approval() {
  const p3 = join(dir, 'p3-concept');
  const file = join(p3, 'approval.md');
  if (!existsSync(file)) { check('approval.md', false, '대표 승인 대기 — `! node harness/scripts/approve.mjs ' + slug + '`'); return 'wait'; }
  const text = readFileSync(file, 'utf8');
  const status = text.match(/^status:\s*(\w+)/m)?.[1];
  if (status === 'rejected') { check('승인', false, '반려: ' + (text.match(/^reason:\s*(.*)$/m)?.[1] || '')); return 'fail'; }
  check('승인 상태', status === 'approved', `status: ${status ?? '없음'}`);
  const saved = Object.fromEntries([...text.matchAll(/^- (key-[^:]+\.html):\s*([0-9a-f]{64})$/gm)].map(m => [m[1], m[2]]));
  const now = Object.fromEntries(listFiles(p3, p => /\/key-[^/]+\.html$/.test(p)).map(p => [basename(p), sha256(p)]));
  const changed = [...new Set([...Object.keys(saved), ...Object.keys(now)])].filter(k => saved[k] !== now[k]);
  check('승인 뒤 변경 없음', Object.keys(saved).length && !changed.length,
    changed.length ? `승인 무효 — 바뀐 파일: ${changed.join(', ')}` : '');
  return checks.every(c => c.ok) ? 'pass' : 'fail';
}

/* ---------- 게이트 ---------- */
const gates = {
  p1() {
    const ref = join(dir, 'p1-research', 'references');
    const manual = listFiles(join(ref, 'manual')), auto = listFiles(join(ref, 'auto'));
    check('레퍼런스 수', manual.length + auto.length >= R.p1.min_references,
      `manual ${manual.length} + auto ${auto.length} (최소 ${R.p1.min_references})`);
    if (auto.length) {
      check('유아이볼 한도', auto.length <= R.uibowl.max_items_per_run, `auto ${auto.length}개 (최대 ${R.uibowl.max_items_per_run})`);
    }
    // 자동 수집 항목(유아이볼): auto/*.md마다 url(유아이볼 화면 주소) · app · screen 줄이 있어야 함
    for (const p of auto.filter(p => p.endsWith('.md'))) {
      const t = readFileSync(p, 'utf8');
      const miss = R.uibowl.auto_fields.filter(f => !new RegExp(`^${f}:\\s*\\S`, 'm').test(t));
      check(`${basename(p)} · 필수 줄`, !miss.length, miss.length ? `없는 줄: ${miss.join(', ')}` : '');
      const url = t.match(/^url:\s*(\S+)/m)?.[1] || '';
      check(`${basename(p)} · 유아이볼 주소`, url.startsWith(R.uibowl.url_prefix), `url이 ${R.uibowl.url_prefix}로 시작해야 함 (지금: ${url || '없음'})`);
      check(`${basename(p)} · 주소 글자`, !/&(amp|lt|gt|quot);/.test(url), 'url에 HTML 글자(&amp; 등)가 들어 있음 — &amp;는 &로 써야 링크가 열림');
    }
    const file = join(dir, 'p1-research', 'analysis.md');
    if (!existsSync(file)) { check('analysis.md', false, '파일 없음'); return verdict(); }
    const sec = readFileSync(file, 'utf8').split(/^## /m).find(s => s.startsWith('반영할 점')) || '';
    const points = sec.split('\n').filter(l => /^\s*(-|\d+\.)\s+\S/.test(l));
    check('반영할 점 수', points.length >= R.p1.min_reflection_points, `${points.length}개 (최소 ${R.p1.min_reflection_points})`);
    points.forEach((l, i) => {
      // 공백이 있는 파일 이름도 읽는다: `백틱으로 감싼 경로` 또는 확장자로 끝나는 경로 (예: references/manual/스크린샷 2026-10-20 오후 11.28.21.png)
      const paths = [...l.matchAll(/`(references\/(?:manual|auto)\/[^`]+)`|(references\/(?:manual|auto)\/[^),`]+?\.(?:png|jpe?g|gif|webp|avif|heic|mp4|mov|md|json|txt))(?=[\s),]|$)/gi)]
        .map(m => m[1] || m[2]);
      const missing = paths.filter(p => !existsSync(join(dir, 'p1-research', p)));
      check(`반영할 점 ${i + 1} · 근거`, paths.length >= R.p1.min_evidence_per_point && !missing.length,
        missing.length ? `없는 파일: ${missing.join(', ')}` : `근거 경로 ${paths.length}개`);
    });
    verdict();
  },
  p2() {
    const file = join(dir, 'p2-design-spec', 'screens.md');
    if (!existsSync(file)) { check('screens.md', false, '파일 없음'); return verdict(); }
    const secs = readFileSync(file, 'utf8').split(/^## /m).slice(1).map(s => {
      const [head, ...body] = s.split('\n');
      return { name: head.trim(), elements: body.filter(l => /^\s*-\s+\S/.test(l)).length };
    });
    const unknown = secs.filter(s => !(s.name in R.screens)).map(s => s.name);
    check('화면 이름', !unknown.length, unknown.length ? `PRD에 없는 화면: ${unknown.join(', ')}` : '');
    for (const scr of chosen) {
      const s = secs.find(x => x.name === scr);
      check(`${scr} · 설계`, s && s.elements >= R.p2.min_elements_per_screen,
        s ? `요소 ${s.elements}개 (최소 ${R.p2.min_elements_per_screen})` : '"## ' + scr + '" 섹션 없음');
    }
    verdict();
  },
  p3() {
    const keys = listFiles(join(dir, 'p3-concept'), p => /\/key-[^/]+\.html$/.test(p));
    check('키스크린 수', keys.length >= R.p3.key_screens_min && keys.length <= R.p3.key_screens_max,
      `${keys.length}개 (${R.p3.key_screens_min}~${R.p3.key_screens_max})`);
    keys.forEach(styleChecks);
    verdict();
  },
  approval() {
    finish(approval());
  },
  p4(withService = false) {
    const pre = approval();
    if (pre !== 'pass') { checks.length = 0; check('P3 승인', false, '승인이 없거나 무효 — P4를 판정할 수 없음'); finish('error'); }
    checks.length = 0;
    check('tokens.md', existsSync(join(dir, 'p4-design', 'tokens.md')), 'p4-design/tokens.md 필요');
    for (const scr of chosen) {
      const file = join(dir, 'p4-design', 'screens', R.screens[scr] + '.html');
      if (!existsSync(file)) { check(`${scr} · 화면`, false, `${rel(file)} 없음`); continue; }
      const parsed = styleChecks(file);
      if (withService) serviceChecks(file, parsed, R.screens[scr]);
    }
    verdict();
  },
  p5() { gates.p4(true); },
};

try { gates[gate](); }
catch (e) { checks.length = 0; check('스크립트 오류', false, e.message); finish('error'); }
