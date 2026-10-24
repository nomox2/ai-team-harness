# (가칭) 디자인 하네스

이 하네스는 이 앱(`docs/prd.md`)의 화면을, 실행할 때마다 고른 화면 단위로
리서치 → 설계 → 시안 → 판정까지 일관된 기준으로 만든다.
이 규칙은 하네스를 실행할 때(`/run-harness`, "하네스 돌려줘", "하네스 이어서 해줘")만 적용한다.
office.html 등 다른 작업에는 적용하지 않는다. 실행 절차는 `.claude/skills/run-harness/SKILL.md`를 따른다.

## 목적
- 매번 달라지는 것: 이번에 만들 화면 (`docs/prd.md` "4. 만들 화면" 중 선택, 또는 "아직 미정" = P1 리서치만)
- 고정된 것: `docs/prd.md`(서비스), `docs/design.md`(디자인 규칙), `docs/story-service.md`(판정 기준), `docs/story-work.md`(작업 흐름)
- 사용자: 대표 1명. Claude Code에서 실행하고 승인도 대표가 한다. 나중에 office.html에 연결한다.
- 완료 기준: 고른 화면이 기준 화면(rules.yaml `frame.attr`) HTML로 만들어지고, design.md 규칙과 PRD 5번의 "어기면 안 되는 것"을 `verify.mjs`가 모두 통과로 판정하고, 대표가 컨셉을 승인한 상태. (규칙이 아직 비어 있는 항목은 판정하지 않는다 — 아래 "새 앱 준비" 참고)

## 파이프라인
| 단계 | 담당 | 입력 | 출력 |
|---|---|---|---|
| P1 리서치 | 모아 (`moa`) | prd.md, 고른 화면 | `p1-research/references/{manual,auto}/`, `p1-research/analysis.md` |
| P2 설계 | 하루 (`haru`) | analysis.md, prd.md, story-service.md | `p2-design-spec/screens.md` |
| P3 컨셉 시안 | 소라 (`sora`) | screens.md, design.md | `p3-concept/key-*.html` (`p3.key_screens_min`~`max`개) |
| ⛳ P3 승인 | 대표 | key-*.html | `p3-concept/approval.md` |
| P4 디자인 | 코다 (`koda`) | 승인된 키스크린, design.md | `p4-design/tokens.md`, `p4-design/screens/*.html` |
| P5 판정 | 테스 (`tes`) | p4-design/screens/*.html, harness/rules.yaml | 결과를 메인 세션에 반환 → `p5-review/review.md` |

되돌아가기: P2 레퍼런스 부족 → P1 / 승인 반려 → P3 (구성 문제면 P2) / P5 실패 → P4

## 산출물과 상태
- 실행마다 `runs/<slug>/` 폴더를 만든다. slug = 날짜-화면 (예: `2026-10-24-home-trend`)
- 진행 상태는 `runs/<slug>/state.json`에 기록한다: 고른 화면, 현재 단계, 게이트별 결과, 실패 횟수
- P1 자동 수집은 유아이볼(실제 앱 화면 DB, MCP)로 한다. 모아가 `references/auto/*.md`로 정리하고, P1 게이트가 `url`(유아이볼 주소)·`app`·`screen` 줄이 있는지 본다.
- 진행 상황은 메인 세션이 AI 팀 사무실 상황판(사무실 페이지 db의 `harness/<slug>`)에 올린다. 사무실은 보여주기만 하고, 판정·승인은 Claude Code에서만 한다. 절차는 run-harness 스킬의 "사무실 동기화".
- 판정 수치는 `harness/rules.yaml` 한 파일에만 둔다. 다른 문서에는 숫자를 복사하지 않고 키 이름으로 가리킨다.
- 새 앱에는 판정 테스트가 들어 있지 않다. 원본 저장소(`ai-team-harness`)의 `harness/tests/run-tests.mjs`가 가계부 앱 기준 예시다.

## 게이트
- 모든 판정은 `node harness/scripts/verify.mjs <slug> <gate>`가 한다. 에이전트의 의견은 판정이 아니다.
- 사람 승인은 P3 한 곳뿐이다. 대표가 직접 `! node harness/scripts/approve.mjs <slug>`를 실행해 `approval.md`를 만든다 (반려는 `--reject "사유"`). 승인 시점의 key-*.html 해시가 지금과 같아야 통과한다.
- 서비스 조건 (story-service.md): PRD 5번 "어기면 안 되는 것"을 O/X로 판정할 수 있게 바꾼 것. `rules.yaml`의 `service`에 코드로 옮겨야 `verify.mjs`가 판정한다 (지금은 `service`가 비어 있어 건너뛴다).
- HTML 표시 규칙: 판정이 읽을 클래스·속성 이름은 `docs/story-service.md`에 정하고, 시안·디자인 에이전트가 같은 이름을 쓰게 한다.

## 판정 결과별 처리
- 통과(pass): state.json 갱신 → 다음 단계
- 실패(fail): 실패 이유를 담당 에이전트에 전달 → 복귀 경로로, 실패 횟수 +1
- 대기(wait): P3 키스크린을 보여주고 멈춤. 대표가 approve.mjs를 실행할 때까지 기다림
- 오류(error): 1회 재시도 → 안 되면 대표에게 보고 (실패 횟수에 안 셈)
- 차단(blocked): 같은 게이트 `gates.max_failures`회 실패 / 훅이 막음 / `uibowl.max_items_per_run` 초과 → 즉시 멈추고 대표 호출

## 파일 역할
| 파일·폴더 | 내용을 만드는 쪽 | 저장하는 쪽 |
|---|---|---|
| `docs/*` | 대표 | 대표 |
| `harness/rules.yaml`, `harness/scripts/*`, `.claude/*` | 대표 승인 후 메인 세션 | 메인 세션 |
| `p1-research/` (`references/manual/` 제외) | 모아 | 메인 세션 (P1 단계일 때만) |
| `p1-research/references/manual/` | 대표 | 대표 |
| `p2-design-spec/` | 하루 | 메인 세션 (P2 단계일 때만) |
| `p3-concept/` (approval.md 제외) | 소라 | 메인 세션 (P3 단계일 때만) |
| `p3-concept/approval.md` | 대표 | 대표 (approve.mjs) |
| `p4-design/` | 코다 | 메인 세션 (P4 단계일 때만) |
| `p5-review/`, `state.json` | 메인 세션 | 메인 세션 |

- 하위 에이전트는 파일을 쓰지 않는다 (Claude Code가 막는다). 결과물을 `===== 파일: <경로> =====` 블록으로 돌려주고, 메인 세션이 **내용을 고치지 않고** 그대로 저장한다 (PDF 원칙 6).
  - 유일한 예외 (대표 확정 2026-10-24): 에이전트 답이 HTML 글자로 바뀌어 올 때가 있다. 저장할 때 `&lt;` `&gt;` `&amp;` `&quot;`를 원래 글자(`<` `>` `&` `"`)로 되돌리는 것만 허용한다. 그 밖의 내용은 한 글자도 바꾸지 않고, 되돌렸다는 사실을 `p5-review/review.md`나 `state.json` 기록에 남긴다.
- 메인 세션이 단계 폴더에 쓸 수 있는 건 `state.json`의 현재 단계 폴더뿐이다. 다른 단계 폴더, approval.md는 훅이 막는다.
- 테스는 모든 파일을 읽을 수 있고 verify.mjs만 실행한다.
- 이 표는 `.claude/hooks/guard-write.mjs`, `.claude/hooks/guard-bash.mjs`가 강제한다.

## 첫 실행 때 묻는 것
1. 이번에 만들 화면
2. `references/manual/`에 레퍼런스를 넣었는지 (자동 수집은 유아이볼로 모아가 한다)

## 절대 하지 않는 것
- approval.md를 대신 쓰거나 고치기, approve.mjs를 대신 실행하기
- docs/ 기준 문서 수정
- 통과시키려고 rules.yaml 숫자를 바꾸기
- 판정 실패 상태에서 다음 단계로 넘어가기
- 로그인이 필요한 곳에서 수집하기, 유아이볼이 아닌 주소를 `references/auto/`에 넣기, `uibowl.max_items_per_run` 넘게 수집하기
- PRD "안 할 것"을 화면에 넣기
- 정해지지 않은 값을 출처 없이 쓰기 — AI가 정한 값에는 (제안)을 붙인다

## 새 앱 준비 (처음 한 번)
이 폴더는 `new-app.sh`로 만든 새 앱용 하네스다. 아래가 채워질 때까지 해당 판정은 건너뛴다.
1. `docs/prd.md` — 5블록을 채운다 (특히 3번 시나리오). "4. 만들 화면"이 사무실 앱의 화면 버튼이 된다.
2. `harness/rules.yaml`의 `screens` — "4. 만들 화면"의 이름마다 파일 이름 한 줄 (예: `홈: home`).
3. `docs/story-service.md` — PRD 5번을 O/X로 판정할 수 있는 조건으로 바꾼다. 확정되면 `rules.yaml`의 `service`에 옮긴다.
4. `docs/design.md` — 디자인 규칙. 확정되면 `rules.yaml`의 `style`(색·폰트·모서리 등)과 `frame`(기준 화면 크기)에 옮긴다.
5. `.claude/agents/moa.md`의 유아이볼 검색 요령을 내 서비스 분야에 맞게 바꾼다.
6. 규칙을 고친 뒤에는 한 화면을 끝까지 돌려 보고 `node harness/scripts/verify.mjs <실행 이름> p5`가 의도대로 판정하는지 확인한다.
