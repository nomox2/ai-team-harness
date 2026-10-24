# P4 토큰 정리 — 기록하기 (2026-10-25-record)

승인된 키스크린(key-record-a.html, key-record-b.html)에서 실제로 쓴 값만 design.md 토큰 이름으로 정리했다. design.md에 없는 값은 만들지 않았다. 판정 수치는 rules.yaml이 기준이다.

## 기준 화면
- `<html lang="ko" data-frame="390x844">` (rules.yaml `frame.attr`)
- 프레임 390 × 844, 좌우 여백 `spacing.lg` 16px

## 색 (colors)
| 토큰 | 값 | 쓴 곳 |
|---|---|---|
| canvas | #ffffff | 화면 바탕, 입력칸, 버튼 바탕, 하단 저장 바, 시트 |
| canvas-soft | #fafafa | 선택된 탭·카테고리 채움, 카테고리 아이콘 원, 즐겨찾기 칩 |
| ink | #171717 | 본문, 선택 테두리, 아이콘 선, 저장 버튼 글자(on-primary) |
| ink-mute | #707070 | 라벨, 선택 안 된 탭 글자, 날짜(.date), 달력 아이콘 |
| ink-mute-2 | #9a9a9a | 글자 수 "0/20자" |
| ink-faint | #b2b2b2 | 입력 안내 문구(placeholder) |
| hairline | #dfdfdf | 입력칸·탭·칩·카드 1px 테두리 |
| hairline-strong | #c7c7c7 | 라디오(선택 안 됨) 테두리 |
| hairline-cool | #ededed | 하단 바 위 구분선, 시트 목록 구분선, 페이지 바깥 배경 |
| primary | #3ecf8e | `.btn-primary`(저장) 배경 — 화면당 1개 |
| accent-tomato | #ff2201 | 필수 별표, 수입 부호·금액 (기호 `+`와 함께) |
| accent-indigo | #054cff | 지출 부호·금액 (기호 `−`와 함께) |
| 그림자용 rgba(0,0,0,…) | 0.4 / 0.12 | 시트 뒤 어둡게 가림, 시트 elevation 3 |

## 글자 (typography)
- font-family: `Pretendard, Inter, -apple-system, 'Apple SD Gothic Neo', sans-serif`
- 금액 숫자: Inter + `font-variant-numeric: tabular-nums` (`.num`)
| 토큰 | 크기/굵기 | 쓴 곳 |
|---|---|---|
| display-md | 28px / 500 / 자간 -0.42px | 금액 입력칸 (28px 이상에만 음수 자간) |
| heading-md | 18px / 500 | 화면 제목 "기록하기", 시트 제목 |
| body-md | 16px / 400 | 입력칸, 날짜, 시트 항목, 기록 항목 카테고리 |
| body-md 굵게 | 16px / 700 | 기록 항목 금액 |
| button-md 계열 | 14~16px / 500 | 탭, 칩, 카테고리 버튼, 저장 버튼 |
| caption | 13px / 400 | 라벨, 기록 항목 날짜 |
| micro | 12px / 400 | 글자 수 |

## 간격 (spacing)
xs 4px · sm 8px · md 12px · lg 16px · xl 24px (라벨 위 여백), 하단 바 아래 여백 24px는 xl, 기록 항목 줄 높이 최소 56px.

## 모서리 (rounded)
- xs 4px: 사용 안 함
- sm 6px: 날짜 입력창, 메모 입력칸, 저장 버튼
- md 8px: 지출/수입 탭, 닫기 버튼
- lg 12px: 카테고리 버튼, 기록 항목 목록 상자
- xl 16px: 날짜 선택 시트 윗 모서리
- full 9999px: 즐겨찾기 칩, 카테고리 아이콘 원, 라디오

## 컴포넌트
- `button-primary-green` → `.btn-primary` "저장". 하단 고정, 높이 52px
- `text-input` → 금액(밑줄형, display-md), 메모, 날짜 입력창
- `record-item` → 저장 전 미리보기 한 줄 (`data-kind`, `.category`, `.date`, `.amount`)
- `pill-tag-soft` 계열 → 즐겨찾기 칩 (터치 44px 이상)
- 선택 버튼 계열 → 지출/수입 탭(`.tab`), 카테고리 버튼(`.cat`)
- 날짜 선택 시트 → `rounded.xl`, elevation 3, 라디오 목록
- 터치 영역: 모든 누를 수 있는 요소 `min-height` 44px 이상

## 그림자 (Elevation)
- 3단계 `0 16px 48px rgba(0,0,0,0.12)`: 날짜 선택 시트

## 키스크린에서 가져온 구성
- 레이아웃은 A(금액 먼저) 기준, B의 날짜 선택 시트를 함께 사용
