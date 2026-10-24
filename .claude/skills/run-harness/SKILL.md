---
name: run-harness
description: (가칭) 디자인 하네스를 실행하거나 이어서 한다. "/run-harness 홈 내역", "하네스 돌려줘", "홈이랑 내역 화면 만들어줘", "하네스 이어서 해줘"에 사용. 리서치(모아) → 설계(하루) → 컨셉 시안(소라) → 대표 승인 → 디자인(코다) → 판정(테스)을 게이트와 함께 진행한다.
argument-hint: "[화면 이름들] 또는 이어서"
---

# 하네스 실행 (메인 세션 = 오케스트레이터)

규칙의 원본은 `CLAUDE.md`와 `harness/rules.yaml`이다. 이 문서는 순서만 정한다.
단계 결과물의 내용은 담당 에이전트가 만들고, 메인 세션은 그 내용을 고치지 않고 현재 단계 폴더에 저장만 한다. 메인 세션이 직접 쓰는 건 `state.json`, `p5-review/`뿐이다.

## 0. 시작 또는 이어하기
- "이어서"면: `runs/*/state.json` 중 `phase`가 `done`이 아닌 가장 최근 것을 연다. 마지막 기록부터 다시 시작한다.
- 새 실행이면 대표에게 먼저 묻는다 (한 번에):
  1. 이번에 만들 화면 — `docs/prd.md` "4. 만들 화면"에 있는 화면 중에서(파일 이름은 `rules.yaml` `screens`에 있는 것만), 아직 못 정했으면 "아직 미정" (인자로 왔으면 확인만)
  2. `references/manual/`에 넣을 레퍼런스가 있는지
- slug = `YYYY-MM-DD-<화면 파일 이름들을 -로>` (예: `2026-10-24-home-history`). 날짜는 `date`로 확인한다.
- `mkdir -p runs/<slug>/p1-research/references/{manual,auto}` 후 `state.json`을 만든다:
  ```json
  { "slug": "...", "screens": ["홈", "내역"], "phase": "p1",
    "gates": {}, "failures": {}, "log": [] }
  ```
- 대표가 레퍼런스를 넣겠다고 했으면 `runs/<slug>/p1-research/references/manual/` 경로를 알려주고 멈춘다. "넣었어"를 들으면 이어간다.

### 화면이 "아직 미정"일 때 (`rules.yaml` `explore`)
- 화면 대신 `explore.screen`을 고른 실행이다. slug = `YYYY-MM-DD-<explore.slug>`, `state.json`의 `screens`는 `["<explore.screen>"]`.
- `explore.gates`에 있는 단계(P1 리서치)만 한다. 모아에게는 "화면이 아직 정해지지 않았으니, PRD 전체("4. 만들 화면"의 화면 후보와 시나리오)를 기준으로, PRD와 같은 종류의 다른 앱의 실제 화면(유아이볼)에서 후보 화면들의 구성을 넓게 정리하라"고 전한다. analysis.md의 마지막 섹션은 "이번 화면에 주는 제안" 대신 화면 후보별로 쓸 만한 점을 적게 한다.
- P1이 pass면 `phase`를 `done`으로 바꾸고 `log`에 "리서치 완료 (화면 미정)"을 남긴다. P2 이후로 가지 않는다. p5-review/는 쓰지 않는다.
- 나중에 화면을 정하면 새 실행으로 시작하고, 모아에게 이 실행의 `p1-research/analysis.md` 경로를 함께 넘겨 참고하게 한다.

## 1. 단계 반복
`gates.order` 순서대로 (`p1 → p2 → p3 → approval → p4 → p5`):

| 단계 | 일하는 에이전트 | 판정 |
|---|---|---|
| p1 | `moa` | `tes` → `verify.mjs <slug> p1` |
| p2 | `haru` | `tes` → `verify.mjs <slug> p2` |
| p3 | `sora` | `tes` → `verify.mjs <slug> p3` |
| approval | (대표) | `tes` → `verify.mjs <slug> approval` |
| p4 | `koda` | `tes` → `verify.mjs <slug> p4` |
| p5 | — | `tes` → `verify.mjs <slug> p5` |

1. 담당 에이전트를 Agent 도구로 부른다 (`subagent_type`: 위 이름). 프롬프트에는 slug, 고른 화면, 다시 하는 경우 직전 실패 이유를 넣는다.
   - 에이전트는 결과물을 `===== 파일: runs/<slug>/<단계 폴더>/<이름> =====` … `===== 끝 =====` 블록으로 돌려준다. 메인 세션은 블록마다 Write로 **내용을 한 글자도 바꾸지 않고** 저장한다. 단 하나의 예외: 에이전트 답이 HTML 글자로 바뀌어 온 경우(`&lt;` `&gt;` `&amp;` `&quot;`)에는 저장할 때 원래 글자(`<` `>` `&` `"`)로 되돌리는 것만 하고, 그 밖의 내용은 그대로 둔다. 되돌렸다는 사실은 `state.json` 기록에 한 줄 남긴다 (CLAUDE.md의 같은 예외). 경로가 현재 단계 폴더 밖이면 저장하지 않고 에이전트에게 되돌린다.
   - 블록이 없거나 잘렸으면 저장하지 말고 에이전트에게 다시 요청한다. 메인 세션이 빈 곳을 채우지 않는다.
2. `tes`를 불러 판정받는다. 메인 세션이 직접 판정하거나 verify 결과를 해석으로 바꾸지 않는다.
3. 결과를 `state.json`에 기록한다: `gates[gate] = { result, at }`, `log`에 한 줄.
4. 결과별 처리:
   - **pass** → `phase`를 다음 단계로.
   - **fail** → `failures[gate] += 1`. `return_to` 단계 담당에게 실패 이유를 넘겨 다시 한다.
     - p2에서 하루가 "레퍼런스 부족"을 돌려주면 판정 전에 p1로 돌아간다.
     - approval 반려: 사유가 화면 구성(무엇이 들어가는지) 문제면 p2, 스타일 문제면 p3.
     - `failures[gate]`가 `gates.max_failures`에 닿으면 **blocked**.
   - **wait** (approval) → 키스크린 파일 경로를 보여주고 대표에게 안내한 뒤 이번 턴을 멈춘다:
     > 확인 후 승인: `! node harness/scripts/approve.mjs <slug>`
     > 반려: `! node harness/scripts/approve.mjs <slug> --reject "사유"`
   - **error** → 1번만 다시 실행. 또 error면 대표에게 보고하고 멈춘다. `failures`에 세지 않는다.
   - **blocked** (`gates.max_failures`회 실패 · 훅 거부 · 유아이볼 한도 초과) → `phase: "blocked"`로 기록하고, 무엇이 막혔는지 보고한 뒤 멈춘다. 대표 지시 전에는 진행하지 않는다.

## 사무실 동기화 (AI 팀 사무실 상황판)
진행 상황을 본인의 AI 팀 사무실 페이지(claude.ai 아티팩트)의 db에 올린다. 이 페이지가 없으면 이 절은 건너뛴다. 사무실은 읽기만 하고, 판정·승인은 여기서만 한다.
메인 세션만 `ArtifactData` 도구로 쓴다. 동기화가 실패해도 하네스는 멈추지 않는다 — 대표에게 한 번만 알린다.

- **언제**: `state.json`을 바꿀 때마다 (시작, 에이전트 호출 직전, 판정 결과, 대기, 차단, 완료).
- **문서** `harness/<slug>` (`set`, 두 번째부터는 직전 결과의 version을 `if_version`으로):
  ```json
  { "slug": "...", "screens": ["내역"],
    "phase": "p1|p2|p3|approval|p4|p5|done", "status": "run|wait|pass|fail|error|blocked|done",
    "who": "moa|haru|sora|koda|tes",
    "message": "대표가 읽을 한 문장 (예: 모아가 레퍼런스를 분석하고 있어요)",
    "gates": { "p1": { "result": "pass", "at": "HH:MM", "fails": ["실패한 check id — detail"] } },
    "failures": { "p3": 1 },
    "log": [{ "at": "HH:MM", "who": "tes", "text": "P3 실패: 모서리 10px" }],
    "updatedAt": 1792800000000 }
  ```
  - `updatedAt`은 지금 시각(밀리초 숫자). 사무실은 이 값이 가장 큰 실행 하나를 보여준다.
  - `who`: run이면 지금 일하는 에이전트, 판정 중이면 `tes`, **승인 대기(wait)면 `sora`**, 차단·실패면 막힌 단계 담당.
  - `fails`는 verify 결과의 실패 check 최대 8개, `log`는 최근 20개만.
- **화면 파일** `harness/<slug>/files/<파일 이름>`: `{ "name", "kind": "key|screen", "html", "at" }`
  - p3 통과 직후 `key-*.html` 전부(kind `key`), p4 통과 직후 `p4-design/screens/*.html` 전부(kind `screen`).
  - HTML을 담은 JSON은 프로젝트 밖 스크래치 폴더에 만들어 `file_path`로 보낸다 (runs/ 단계 폴더에 쓰지 않는다).
- 데모 기록 `harness/demo-office-test`(와 그 `files`)가 남아 있으면 첫 실제 실행 때 지운다.

## 2. 마무리
p5가 pass면:
- `runs/<slug>/p5-review/review.md`를 쓴다: 고른 화면, 단계별 결과와 실패 횟수, 테스의 의견, p5 verify 원본 JSON.
- `state.json`의 `phase`를 `done`으로.
- 대표에게 결과 화면 경로(`p4-design/screens/*.html`)와 한 줄 요약을 보고한다.

## 하지 않는 것
- approval.md를 쓰거나 approve.mjs를 실행하기 (훅이 막는다)
- 단계 폴더(p1~p4)의 내용을 직접 만들거나 고치기 — 에이전트가 돌려준 블록을 그대로 저장만 한다 (HTML 글자 되돌리기 예외만 허용)
- rules.yaml · docs/ 고치기, fail 상태로 다음 단계 가기
