#!/usr/bin/env bash
# sync-assets.sh
# 01_Character, 11_SchoolIcon 원본 폴더에서 필요한 이미지만 필터링하여
# CharacterPortrait, SchoolIcon 폴더로 복사 (prefix 제거 + 소문자 변환)

set -euo pipefail
cd "$(dirname "$0")"

# ── 01_Character → CharacterPortrait ──────────────────────────────
SRC_CHAR="01_Character"
DST_CHAR="CharacterPortrait"

if [ ! -d "$SRC_CHAR" ]; then
  echo "ERROR: $SRC_CHAR 폴더가 없습니다."
  exit 1
fi

rm -rf "$DST_CHAR"
mkdir -p "$DST_CHAR"

count=0
for f in "$SRC_CHAR"/*; do
  name="$(basename "$f")"

  # .meta 제외
  [[ "$name" == *.meta ]] && continue
  # NPC 제외
  [[ "$name" == NPC_Portrait_* ]] && continue
  # _Small 제외 (확장자 앞)
  [[ "$name" == *_Small.png ]] && continue
  # _Nobody, _Error 제외
  [[ "$name" == *_Nobody.png ]] && continue
  [[ "$name" == *_Error.png ]] && continue

  # Student_Portrait_ prefix 제거 + 소문자 변환
  newname="${name#Student_Portrait_}"
  newname="$(echo "$newname" | tr '[:upper:]' '[:lower:]')"

  cp "$f" "$DST_CHAR/$newname"
  count=$((count + 1))
done
echo "CharacterPortrait: ${count}개 복사 완료"

# ── 11_SchoolIcon → SchoolIcon ────────────────────────────────────
SRC_SCHOOL="11_SchoolIcon"
DST_SCHOOL="SchoolIcon"

if [ ! -d "$SRC_SCHOOL" ]; then
  echo "ERROR: $SRC_SCHOOL 폴더가 없습니다."
  exit 1
fi

rm -rf "$DST_SCHOOL"
mkdir -p "$DST_SCHOOL"

count=0
for f in "$SRC_SCHOOL"/*; do
  name="$(basename "$f")"

  # .meta 제외
  [[ "$name" == *.meta ]] && continue

  # School_Icon_ prefix 제거 + 소문자 변환
  newname="${name#School_Icon_}"
  newname="$(echo "$newname" | tr '[:upper:]' '[:lower:]')"

  cp "$f" "$DST_SCHOOL/$newname"
  count=$((count + 1))
done
echo "SchoolIcon: ${count}개 복사 완료"

echo "완료!"
