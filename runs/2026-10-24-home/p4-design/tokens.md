# 디자인 토큰 (홈)

기준: 승인된 키스크린 `key-home-a.html`(A안, 승인 해시 d3f9965b…fff8)에서 실제로 쓴 값만 정리한다. 값은 모두 docs/design.md에 있는 것이고, 새로 만든 값은 없다.

## 색 (colors)
| 토큰 | 값 | 쓴 곳 |
|---|---|---|
| `primary` | #3ecf8e | 기록하기 채움 버튼(`btn-primary`) 배경. 화면에 1개 |
| `on-primary` | #171717 | 기록하기 버튼 글자 |
| `ink` | #171717 | 기본 글자, 남은 예산 금액, 카테고리, 진행 막대 채움, 현재 탭 |
| `ink-secondary` | #212121 | 카테고리 아이콘 글자 |
| `ink-mute` | #707070 | 라벨, 날짜, 날짜 머리글, 전체 보기 링크 |
| `ink-mute-2` | #9a9a9a | 현재가 아닌 탭 글자 |
| `canvas` | #ffffff | 화면·탭 바 배경 |
| `canvas-soft` | #fafafa | 남은 예산 영역 배경, 카테고리 아이콘 원 배경 |
| `hairline` | #dfdfdf | 오늘·이번 주 숫자 카드 테두리 |
| `hairline-cool` | #ededed | 기록 항목 구분선, 탭 바 윗선, 진행 막대 바탕 |
| `hairline-cool-2` | #efefef | 화면 밖 바탕(body) |
| `accent-indigo` | #054cff | 지출 금액 (기호 −와 함께) |
| `accent-tomato` | #ff2201 | 수입 금액 (기호 +와 함께) |

- 초록은 `.btn-primary` 안에서만 쓴다. 금액에는 쓰지 않는다.
- 수입·지출 색은 금액 글자에만 쓰고 배경에는 쓰지 않는다.
- 그림자는 `rgba(0,0,0,0.08)` 하나만 쓴다 (Elevation 2).

## 글자 (typography)
font-family: `Pretendard, Inter, -apple-system, 'Apple SD Gothic Neo', sans-serif`. 금액(`.amount`)은 `Inter, Pretendard, sans-serif` + `tabular-nums`.

| 토큰 | 크기·굵기 | 쓴 곳 |
|---|---|---|
| `display-md` | 28px / 500 / 자간 -0.42px, 줄간격 1.25 | 남은 예산 금액 |
| `heading-md` | 18px / 500 / 1.4 | "최근 내역" 제목, 오늘·이번 주 숫자 |
| `body-md` | 16px / 400 / 1.5 (금액은 700) | 카테고리, 기록 항목 금액 |
| `button-md` | 14px / 500 | 기록하기 버튼, 전체 보기 링크 |
| `caption` | 13px / 400 / 1.45 | 라벨, 날짜, 날짜 머리글, 탭 이름 |
| `micro` | 12px / 400 / 1.45 | 진행 막대 아래 "쓴 금액 / 남은 금액" |

## 모서리 (rounded)
| 토큰 | 값 | 쓴 곳 |
|---|---|---|
| `lg` | 12px | 남은 예산 영역, 오늘·이번 주 숫자 카드, 기록하기 버튼 |
| `full` | 9999px | 진행 막대, 카테고리 아이콘 원 |

## 간격 (spacing)
| 토큰 | 값 | 쓴 곳 |
|---|---|---|
| `xxs` | 2px | 숫자 위 간격 |
| `xs` | 4px | 금액 위 간격, 날짜 머리글 위 간격 |
| `sm` | 8px | 막대 아래 글자 위 간격, 날짜 머리글 안쪽 위아래 |
| `md` | 12px | 숫자 카드 사이, 기록 항목 안 요소 사이 |
| `lg` | 16px | 좌우 여백, 영역 안쪽 여백, 영역 사이 |
| `xl` | 24px | 화면 위 여백 |

## 컴포넌트
| 컴포넌트 | 구성 |
|---|---|
| `budget-left` | `canvas-soft` 배경, `rounded.lg`, 안쪽 16px. 라벨(`caption`, `ink-mute`) + 금액(`display-md`) + 막대(높이 8px, `rounded.full`, 바탕 `hairline-cool`, 채움 `ink`) + 막대 아래 글자(`micro`) |
| 숫자 카드 (오늘·이번 주) | 1px `hairline` 테두리, `rounded.lg`, 높이 64px 이상, 숫자 `heading-md` `accent-indigo` |
| `record-item` | 줄 높이 56px 이상, 아이콘 원 36px(`canvas-soft`) · 카테고리와 날짜 · 금액, 아래 1px `hairline-cool` 구분선. 항목마다 `.category` `.date` `.amount` |
| 날짜 머리글 | `caption` `ink-mute`, 왼쪽 날짜, 오른쪽 그날 합계 |
| `btn-primary` (button-primary-green) | `primary` 배경, `on-primary` 글자, `button-md`, 높이 56px, `rounded.lg`, 오른쪽 아래에 떠 있음, 그림자 Level 2 |
| 하단 탭 바 | 높이 64px, `canvas` 배경, 윗선 `hairline-cool`, 탭 4개(홈·내역·통계·예산·설정), 현재 탭은 `ink` 굵게, 나머지는 `ink-mute-2`. 탭 높이 44px 이상 |

## 터치 영역
`a`, `button`, `.tab`은 `min-height: 44px`. 기록하기 버튼은 56px.
