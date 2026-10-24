// 하네스 스크립트 공용 도구 — 외부 패키지 없이 동작한다.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
// 테스트(harness/tests)만 runs/ 위치를 임시 폴더로 바꾼다. 규칙은 항상 이 저장소의 rules.yaml을 읽는다.
export const RUNS_ROOT = process.env.HARNESS_RUNS_ROOT || ROOT;

// CSS 이름 색 — design.md 팔레트 밖이므로 쓰면 실패
export const NAMED_COLORS = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
  'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey ' +
  'darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey ' +
  'darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite ' +
  'gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon ' +
  'lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue ' +
  'lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid ' +
  'mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin ' +
  'navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff ' +
  'peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver ' +
  'skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '));

/* ---------- rules.yaml: 이 하네스가 쓰는 YAML 부분집합만 읽는다 ---------- */
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}
function scalar(s) {
  s = s.trim();
  if (s === '') return null;
  if (/^["'].*["']$/.test(s)) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith('[')) return splitFlow(s.slice(1, s.lastIndexOf(']'))).map(scalar);
  return s;
}
function splitFlow(s) {
  const out = []; let cur = '', q = null;
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === ',') { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out.filter(x => x.trim() !== '');
}
export function parseYaml(text) {
  const lines = [];
  const raw = text.split('\n');
  for (let i = 0; i < raw.length; i++) {
    let l = stripComment(raw[i]).replace(/\s+$/, '');
    if (!l.trim()) continue;
    // 여러 줄 flow 목록 [ ... ] 합치기
    if (/:\s*\[/.test(l) && !l.includes(']')) {
      while (++i < raw.length) { l += ' ' + stripComment(raw[i]).trim(); if (l.includes(']')) break; }
    }
    lines.push(l);
  }
  const root = {}; const stack = [{ indent: -1, obj: root }];
  for (const l of lines) {
    const indent = l.match(/^ */)[0].length;
    const m = l.trim().match(/^("[^"]+"|'[^']+'|[^:]+):(.*)$/);
    if (!m) throw new Error('rules.yaml을 읽을 수 없는 줄: ' + l);
    while (stack.at(-1).indent >= indent) stack.pop();
    const key = scalar(m[1]); const rest = m[2].trim();
    const parent = stack.at(-1).obj;
    if (rest === '') { parent[key] = {}; stack.push({ indent, obj: parent[key] }); }
    else parent[key] = scalar(rest);
  }
  return root;
}
export const loadRules = () => parseYaml(readFileSync(join(ROOT, 'harness', 'rules.yaml'), 'utf8'));

/* ---------- HTML: 판정에 필요한 만큼만 트리로 만든다 ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
export function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[5] !== undefined) { stack.at(-1).children.push({ tag: '#text', text: m[5] }); continue; }
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) { // 닫는 태그
      const i = stack.map(n => n.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (tag === 'style' || tag === 'script') { // 내용은 텍스트로 통째로
      const end = html.indexOf(`</${tag}`, re.lastIndex);
      const stop = end < 0 ? html.length : end;
      node.children.push({ tag: '#text', text: html.slice(re.lastIndex, stop) });
      re.lastIndex = stop;
      continue;
    }
    if (!VOID.has(tag) && !m[4]) stack.push(node);
  }
  return root;
}
export const classes = n => (n.attrs?.class || '').split(/\s+/).filter(Boolean);
export const hasClass = (n, c) => classes(n).includes(c);
export function* walk(n) { yield n; for (const c of n.children || []) yield* walk(c); }
export const findAll = (n, pred) => [...walk(n)].filter(x => x.tag && !x.tag.startsWith('#') && pred(x));
export const textOf = n => [...walk(n)].filter(x => x.tag === '#text').map(x => x.text).join('').trim();

/* ---------- CSS: <style> 블록과 style="" 속성 ---------- */
export function cssOf(html, tree) {
  const blocks = findAll(tree, n => n.tag === 'style').map(textOf);
  const inline = findAll(tree, n => n.attrs.style).map(n => `__inline__ { ${n.attrs.style} }`);
  return [...blocks, ...inline].join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
}
export function cssRules(css) {
  const out = [];
  // @media 같은 묶음은 안쪽 규칙만 본다
  for (const m of css.replace(/@[^{]+\{([\s\S]*?\})\s*\}/g, '$1').matchAll(/([^{}]+)\{([^{}]*)\}/g))
    out.push({ selector: m[1].trim(), decls: m[2] });
  return out;
}

/* ---------- 파일 ---------- */
export const runDir = slug => join(RUNS_ROOT, 'runs', slug);
export function listFiles(dir, pred = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, pred));
    else if (pred(p)) out.push(p);
  }
  return out;
}
export const sha256 = p => createHash('sha256').update(readFileSync(p)).digest('hex');
export const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
