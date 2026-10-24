# P5 검토 — 내역 (2026-10-24-history)

## 고른 화면
내역 → `p4-design/screens/history.html` (승인된 키스크린 A "한 줄 정석" 기준)

## 단계별 결과
| 단계 | 결과 | 실패 횟수 |
|---|---|---|
| p1 | pass | 0 |
| p2 | pass | 0 |
| p3 | pass | 0 |
| approval | pass (대표 승인, 해시 일치) | 0 |
| p4 | pass (13개 check ok) | 0 |
| p5 | pass (31개 check ok) | 0 |

## 저장 기록
코다 결과를 저장할 때 HTML 글자(`&lt;` `&gt;`)를 `<` `>`로 되돌리는 것만 했다 (대표 확정 예외). 그 밖의 내용은 그대로다.

## 테스의 의견
실패 없음, 의견 없음. 기록 항목 4개 모두 금액·카테고리·날짜와 −/+ 기호가 통과했다. 내역 화면에는 홈 전용 `budget-left` 검사가 없다.

## 코다가 알린 점
- 키스크린 A·B·C가 모두 승인 상태라 design.md에 가장 충실한 A를 이어 썼다.
- 확인창 뒤 어두운 막 `rgba(0,0,0,0.4)`는 P4·P5 판정을 통과했다.

## p5 verify 원본 요약
result: pass, checks 31개 전부 ok: true (tokens.md, 기준 화면, 색, rgba/hsl, 모서리, 폰트, 초록 규칙, `.btn-primary` 1개, script 없음, 외부 리소스, 이름 색, 터치 영역, 버튼 높이, 기록 1~4의 금액·카테고리·날짜·수입지출 구분, `data-nav="record"`).
