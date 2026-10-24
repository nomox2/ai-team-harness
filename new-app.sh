#!/bin/bash
# 새 앱용 하네스 폴더를 만들어요. 이 저장소가 템플릿이고, 앱마다 폴더를 하나씩 만들어 써요.
# 사용: bash new-app.sh <앱 이름> [만들 위치]
#   예) bash new-app.sh 포트폴리오            → 이 저장소 옆에 "포트폴리오" 폴더
#       bash new-app.sh 포트폴리오 ~/Desktop/my-app
# 가져가는 것: 하네스 엔진(스크립트·훅·직원 설명서·스킬)과 빈 템플릿(docs·rules.yaml·CLAUDE.md)
# 가져가지 않는 것: 이 저장소의 실행 결과(runs)·가계부 문서·판정 테스트
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
NAME="${1:-}"
if [ -z "$NAME" ]; then echo "사용: bash new-app.sh <앱 이름> [만들 위치]"; exit 1; fi
DEST="${2:-$(dirname "$HERE")/$NAME}"
if [ -e "$DEST" ]; then echo "이미 있는 곳이에요: $DEST (다른 이름이나 위치를 써 주세요)"; exit 1; fi

mkdir -p "$DEST/harness" "$DEST/runs"
cp -R "$HERE/.claude" "$DEST/.claude"
cp -R "$HERE/harness/scripts" "$DEST/harness/scripts"
cp -R "$HERE/harness/guides" "$DEST/harness/guides"
cp -R "$HERE/template/docs" "$DEST/docs"
cp "$HERE/template/CLAUDE.md" "$DEST/CLAUDE.md"
cp "$HERE/template/harness/rules.yaml" "$DEST/harness/rules.yaml"
cp "$HERE/.gitignore" "$DEST/.gitignore"
touch "$DEST/runs/.gitkeep"
# 이 저장소에서 쓰다 남은 파일은 가져오지 않아요
find "$DEST" -name .DS_Store -delete
rm -rf "$DEST/.claude/worktrees" "$DEST/.claude/settings.local.json"

# 모아의 설명서: "지금은 가계부·금융 앱"은 원본 예시라서 새 앱에서는 PRD를 따르도록
python3 - "$DEST/.claude/agents/moa.md" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read().replace('(지금은 가계부·금융 앱)', '(분야는 PRD를 따른다)')
open(p, 'w', encoding='utf-8').write(s)
PY

# 문서의 "(앱 이름)"을 입력한 이름으로
for f in "$DEST"/docs/*.md; do
  python3 - "$f" "$NAME" <<'PY'
import sys
p, name = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read().replace('(앱 이름)', name)
open(p, 'w', encoding='utf-8').write(s)
PY
done

cat > "$DEST/README.md" <<EOF
# $NAME — AI 팀 하네스

\`new-app.sh\`로 만든 하네스 폴더예요. 처음 한 번 \`CLAUDE.md\`의 "새 앱 준비"를 따라 채우면 돼요.

1. \`docs/prd.md\` 5블록 채우기 (4번이 화면 버튼이 돼요)
2. \`harness/rules.yaml\`의 \`screens\`에 화면 이름 → 파일 이름 적기
3. Claude Code를 이 폴더에서 열고 \`/run-harness <화면 이름>\`
EOF

(cd "$DEST" && git init -q -b main && git add -A && git commit -q -m "새 앱 하네스: $NAME")

echo "만들었어요: $DEST"
echo
echo "다음 순서"
echo "  1) $DEST/docs/prd.md 를 채워요 (5블록, 4번이 사무실 앱의 화면 버튼이 돼요)"
echo "  2) $DEST/harness/rules.yaml 의 screens 에 '화면 이름: 파일 이름'을 적어요"
echo "  3) 사무실 앱으로 보려면: OFFICE_ROOT=\"$DEST\" OFFICE_PORT=4779 node <ai-team 폴더>/server.mjs"
echo "     (앱마다 포트를 다르게 하면 여러 개를 동시에 열 수 있어요)"
