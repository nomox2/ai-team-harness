# 화면 HTML 표시 규칙

소라(P3)와 코다(P4)가 만드는 모든 화면 HTML은 이 규칙을 따른다. `verify.mjs`가 이 표시를 세어서 판정한다.
숫자 기준은 `harness/rules.yaml`에 있다. 이 문서에는 숫자를 적지 않는다.

## 파일
- HTML 파일 하나에 `<style>` 하나. `<script>`는 쓰지 않는다.
- 외부 리소스는 Pretendard 웹폰트 링크만 허용한다. 썸네일 자리는 팔레트 색 상자나 인라인 SVG로 채운다.
- 루트: `<html lang="ko" data-frame="…">` — 값은 rules.yaml `frame.attr`. 화면 본문은 그 크기(폭×높이) 프레임 안에 만든다.

## 디자인 규칙 (docs/design.md)
- 색: design.md 팔레트의 hex만. `rgba()`는 그림자용 `rgba(0,0,0,…)`만. 이름 색(`red`, `white` 등)과 `hsl()`은 쓰지 않는다.
- 모서리: design.md `rounded` 값(px)만. `%`는 쓰지 않는다.
- 폰트: `font-family: Pretendard, Inter, -apple-system, 'Apple SD Gothic Neo', sans-serif` (코드는 design.md의 mono 목록).
- 초록 채움 버튼: `class="btn-primary"`, 화면당 rules.yaml 개수 이하. 초록 배경은 `.btn-primary` 규칙 안에서만 쓴다.
- 누를 수 있는 요소(`button`, `a`, `.btn*`, `.tab`, `.chip`): `min-height`를 rules.yaml 터치 기준 이상으로. 버튼이 있으면 `button` 또는 `.btn` 규칙에 `min-height`를 반드시 적는다.

## 서비스 표시 (docs/story-service.md)
기록 항목 (`record-item`) — 홈의 최근 내역, 내역, 통계 상세 등 기록이 나오는 곳 어디서나 같은 표시:
```html
<li class="record-item" data-kind="expense">   <!-- 수입은 data-kind="income" -->
  <span class="category">카페</span>
  <span class="date">10월 24일</span>
  <span class="amount">−4,500원</span>          <!-- 수입은 +2,500,000원 -->
</li>
```
- `.amount`, `.category`, `.date`는 항목마다 반드시 있고 글자가 있어야 한다. 날짜 묶음 제목으로 대신할 수 없다.
- `.amount`는 맨 앞에 기호를 쓴다: 지출 `−`(또는 `-`), 수입 `+`. 기호 목록은 rules.yaml `service.kinds`. 색만으로 구분하지 않는다.

남은 예산 (`budget-left`) — rules.yaml `service.budget_left.screens`의 화면(홈)에 반드시:
```html
<section class="budget-left">
  <span class="label">이번 달 남은 예산</span>
  <span class="amount">328,000원</span>   <!-- 숫자가 있어야 한다 -->
</section>
```

기록하기로 가는 길 — 기록하기 화면을 뺀 모든 화면에 `data-nav="record"` 요소(버튼이나 링크)를 하나 이상 둔다 (예: 하단 탭 바의 기록 버튼):
```html
<a class="btn" data-nav="record" href="#">기록</a>
```
