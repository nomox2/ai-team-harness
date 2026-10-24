# 내역 화면 디자인 토큰 (P4)

기준: 승인된 키스크린 key-history-a/b/c 중 **A "한 줄 정석"** 의 스타일을 이어 썼다. 근거는 design.md에 가장 충실하고(흰 바탕, 얇은 구분선), approval.md에 안 하나로 좁힌 기록이 없어 세 안 모두 승인 상태이기 때문이다.
모든 값은 `docs/design.md` 토큰 이름이다. 새 값은 만들지 않았다.

## 색 (colors)
| 토큰 | 값 | 쓴 곳 |
|---|---|---|
| `canvas` | #ffffff | 화면 바탕, 칩·월 선택·탭 바 배경 |
| `canvas-soft` | #fafafa | 카테고리 아이콘 원 배경 |
| `ink` | #171717 | 제목, 카테고리, 날짜 머리글의 날짜, 현재 칩 배경, 현재 탭, 기록 탭 테두리 |
| `ink-secondary` | #212121 | 아이콘 글자 |
| `ink-mute` | #707070 | 라벨, 메모, 날짜(.date), 월 머리글, 비활성 칩 글자 |
| `ink-mute-2` | #9a9a9a | 비활성 탭 글자 |
| `on-primary` | #171717 | 초록 버튼 위 글자 |
| `on-dark` | #ffffff | 현재 칩 글자 |
| `primary` | #3ecf8e | 오른쪽 아래 "+" 버튼 (`.btn-primary`, 화면당 1개) |
| `accent-indigo` | #054cff | 지출 금액 (− 기호와 함께), 월 지출 합계 |
| `accent-tomato` | #ff2201 | 수입 금액 (+ 기호와 함께) |
| `hairline` | #dfdfdf | 비활성 칩 테두리, 월 머리글 윗선 |
| `hairline-strong` | #c7c7c7 | 월 선택 버튼 테두리 |
| `hairline-cool` | #ededed | 기록 항목 사이 선, 탭 바 윗선 |
| `hairline-cool-2` | #efefef | 화면 밖 배경(body) |
| `canvas-night` | #1c1c1c | 수정 화면 "저장" 버튼 (`button-on-dark`) |
| 그림자 | rgba(0,0,0,0.08) 0 8px 24px | "+" 버튼 (Elevation level 2) |
| 딤 | rgba(0,0,0,0.4) | 삭제 확인창 뒤 어두운 막 (검정 rgba만) |

## 글자 (typography) — 모두 `Pretendard, Inter, -apple-system, 'Apple SD Gothic Neo', sans-serif`
| 토큰 | 쓴 곳 |
|---|---|
| `display-md` 28px/500, 자간 -0.42px | 화면 제목 "내역", 월 지출 합계 |
| `heading-lg` 22px/500 | 빈 상태·수정 화면·확인창 제목 |
| `body-md` 16px | 카테고리, 입력 값 |
| `body-md` 굵게(700) | 목록 금액 (Inter, tabular-nums) |
| `button-md` 14px/500 | 월 선택, 칩, 버튼 |
| `caption` 13px | 라벨, 메모, 날짜, 날짜 머리글, 탭 글자 |

## 간격 (spacing)
`lg` 16px 좌우 여백 · `md` 12px 항목 안 간격 · `sm` 8px 칩 사이 · `xs` 4px · `xxs` 2px · `xl` 24px 월 머리글 위

## 모서리 (rounded)
`xs` 4px · `sm` 6px 월 선택 버튼, 입력칸 · `md` 8px 칩, 기록 탭, 보조 버튼 · `lg` 12px 월 선택 메뉴 · `xl` 16px 확인창 · `full` 아이콘 원, "+" 버튼

## 컴포넌트
- `record-item`: 아이콘 원 36px + 카테고리·메모·날짜 + 금액, 줄 최소 높이 56px, 구분선 1px `hairline-cool`
- 날짜 머리글: 날짜(굵게) + 그날 합계(Inter)
- 칩 3개 (보기 필터): 최소 높이 44px, 현재는 `ink` 채움
- `button-primary-green` 변형: 둥근 "+" 버튼 (design.md 보완에 따라 화면당 1개)
- `button-secondary-outline`: 월 선택, "기록하기"(빈 상태), "취소"
- `button-on-dark`: 수정 화면 "저장", 확인창 "삭제"
- `text-input`: 수정 화면 입력칸
- 하단 탭 바: 홈 · 내역(현재) · 기록 · 통계 · 예산·설정, 가운데 "기록"(`data-nav="record"`)
