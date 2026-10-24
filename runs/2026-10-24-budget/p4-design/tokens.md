# 토큰 정리 (예산·설정, 예산 페이지 + 설정 페이지)

출처: 승인된 키스크린 `p3-concept/key-budget.html`, `key-settings.html`과 `docs/design.md`. design.md에 없는 값은 만들지 않았다. 숫자 기준은 `harness/rules.yaml`을 가리킨다.

## 기준 화면
- 프레임 `390 × 844` (`frame.attr`), 좌우 여백 `{spacing.lg}` 16px
- 폰트 `Pretendard, Inter, -apple-system, 'Apple SD Gothic Neo', sans-serif`. 금액은 Inter + `tabular-nums`

## 색
| 토큰 | hex | 쓴 곳 |
|---|---|---|
| `colors.canvas` | #ffffff | 화면 바탕, 탭 바, 칩 바탕, 입력 바탕 |
| `colors.canvas-soft` | #fafafa | 예산 카드 바탕, 카테고리 아이콘 원 |
| `colors.ink` | #171717 | 본문, 진행 막대 채움, 현재 탭, 선택된 칩 바탕, 초록 버튼 위 글자(`on-primary`) |
| `colors.ink-secondary` | #212121 | 아이콘 글자 |
| `colors.ink-mute` | #707070 | 라벨, 보조 글자, 텍스트 버튼 |
| `colors.ink-mute-2` | #9a9a9a | 현재가 아닌 탭 |
| `colors.on-dark` | #ffffff | 선택된 칩 글자 |
| `colors.hairline` | #dfdfdf | 칩·입력 테두리 |
| `colors.hairline-strong` | #c7c7c7 | 보조 버튼 테두리 |
| `colors.hairline-cool` | #ededed | 구분선, 막대 바탕, 탭 바 윗선 |
| `colors.hairline-cool-2` | #efefef | 화면 밖 body 배경 |
| `colors.primary` | #3ecf8e | 기록하기 `.btn-primary` 1개 (화면당 1개) |
| `colors.accent-indigo` | #054cff | 지출 금액 (`−` 기호와 함께) |
| `colors.accent-tomato` | #ff2201 | 수입 금액 (`+` 기호와 함께, 설정 페이지 즐겨찾기만) |

## 글자
| 토큰 | 크기/굵기 | 쓴 곳 |
|---|---|---|
| `display-md` | 28px / 500 / 자간 -0.42px | 이번 달 예산 금액 (줄간격 1.25) |
| `heading-md` | 18px / 500 / 1.4 | 섹션 제목, 설정 페이지 제목 |
| `body-md` | 16px / 400 / 1.5 | 카테고리 이름, 즐겨찾기 이름, 입력 글자 |
| `body-md` 굵게 | 16px / 700 | 목록 금액 |
| `button-md` | 14px / 500 | 버튼, 칩, 텍스트 버튼, 설정 링크 |
| `caption` | 13px / 400 / 1.45 | 예산 카드 라벨, 즐겨찾기 카테고리, 탭 이름 |
| `micro` | 12px / 400 / 1.45 | 막대 아래 쓴 금액·남은 금액 |

## 간격 (`spacing`)
xs 4px · sm 8px · md 12px · lg 16px · xl 24px. 줄 높이는 카테고리 행 60px, 설정 행 52px (둘 다 최소).

## 모서리 (`rounded`)
- xs 4px: 사용 안 함
- sm 6px: 예산 수정 입력, 저장·취소 버튼
- lg 12px: 예산 카드, 기록하기 버튼 (키스크린과 동일)
- full 9999px: 진행 막대, 아이콘 원, 칩

## 그림자
- Level 2 `0 8px 24px rgba(0,0,0,0.08)`: 기록하기 버튼

## 컴포넌트
- `budget-card`: `canvas-soft` 배경, `rounded.lg`, 안쪽 16px. 라벨(caption), 금액(display-md), 진행 막대(8px, `rounded.full`), 막대 아래 쓴 금액·남은 금액(micro). 홈의 `budget-left`와 같은 문법이지만 홈 전용 `.budget-left` 클래스는 쓰지 않았다.
- 카테고리 예산 행: 아이콘 원 36px + 이름 + 4px 작은 막대 + 지출 금액. 줄 사이 1px `hairline-cool`. 기록 항목이 아니므로 `record-item`을 쓰지 않았다.
- 설정 행: 아이콘 원 36px + 이름 + 텍스트 버튼 "편집". 즐겨찾기 행: 이름 + 카테고리 + 금액(날짜 없음).
- `chip`: 높이 44px 이상, `rounded.full`, 1px `hairline`. 선택된 칩은 `ink` 배경 + `on-dark` 글자 (초록 아님).
- `button-secondary-outline`: 예산 수정의 "저장"·"취소"
- `text-input`: 예산 수정 금액 입력
- `btn-primary`: "+ 기록하기" (`data-nav="record"`), 화면당 1개
- 하단 탭 바: 높이 64px, 4개 탭 (홈 · 내역 · 통계 · 예산·설정), 현재 탭은 `ink` + 700

## 터치 영역
`button`, `a`, `.tab`, `.chip`, `.btn`, `summary` 모두 `min-height: 44px` 이상 (`touch_min_px`).
