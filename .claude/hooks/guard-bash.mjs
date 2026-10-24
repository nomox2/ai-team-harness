#!/usr/bin/env node
// PreToolUse(Bash) — 판정자는 verify.mjs만, 누구도 승인을 대신하지 못하게 한다.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const cmd = input.tool_input?.command || '';
const agent = input.agent_type || null;

const decide = (permissionDecision, reason) => {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason } }));
  process.exit(0);
};

if (agent === 'tes') {
  if (/^\s*node\s+harness\/scripts\/verify\.mjs\s+[\w.-]+\s+(p1|p2|p3|approval|p4|p5)\s*$/.test(cmd)) process.exit(0);
  decide('deny', '테스는 `node harness/scripts/verify.mjs <slug> <gate>`만 실행할 수 있어요.');
}

if (/approve\.mjs/.test(cmd)) decide('deny', '승인은 대표만 해요. 대표에게 `! node harness/scripts/approve.mjs <slug>` 실행을 요청하세요.');

const WRITES = /(>>?|\btee\b|\bcp\b|\bmv\b|\brm\b|\bsed\s+-i|\btouch\b|\bln\b|\btruncate\b)/;
if (WRITES.test(cmd)) {
  if (/approval\.md/.test(cmd)) decide('deny', 'approval.md는 대표만 만들어요.');
  if (/runs\/[^\s/]+\/p[1-4]-[\w-]+/.test(cmd)) decide('deny', '단계 폴더(p1~p4)는 담당 에이전트가 Write/Edit로만 써요.');
  if (/(^|[\s"'=])(\.\/)?docs\//.test(cmd)) decide('ask', 'docs/는 대표만 고치는 기준 문서예요.');
  if (/(^|[\s"'=])(\.\/)?(harness\/|CLAUDE\.md|\.claude\/)/.test(cmd)) decide('ask', '하네스 규칙·설정 파일이에요. 대표 승인 후에만 고칠 수 있어요.');
}
process.exit(0);
