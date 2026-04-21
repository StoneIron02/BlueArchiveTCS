#!/usr/bin/env bash
# sync-assets.sh
# 01_Character, 11_SchoolIcon 원본 폴더에서 필요한 이미지만 필터링하여
# CharacterPortrait, SchoolIcon 폴더로 복사 (prefix 제거 + 소문자 변환)

set -euo pipefail
cd "$(dirname "$0")"

# ── 진행률 바 ─────────────────────────────────────────────────────
PROGRESS_WIDTH=30
BAR_FULL='##############################'   # PROGRESS_WIDTH 만큼 '#'
BAR_EMPTY='------------------------------' # PROGRESS_WIDTH 만큼 '-'

draw_progress() {
  local current=$1 total=$2 label=$3
  local percent=0 filled=0
  if (( total > 0 )); then
    percent=$(( current * 100 / total ))
    filled=$(( current * PROGRESS_WIDTH / total ))
  fi
  local empty=$(( PROGRESS_WIDTH - filled ))
  printf '\r%-18s [%s%s] %3d%% (%d/%d)' \
    "$label" "${BAR_FULL:0:filled}" "${BAR_EMPTY:0:empty}" \
    "$percent" "$current" "$total"
}

clear_line() { printf '\r\033[K'; }

# ── 병렬 복사 슬롯 관리 ──────────────────────────────────────────
# I/O 바운드라 CPU 수의 2배 기본. SYNC_JOBS=N 환경변수로 오버라이드.
if [[ -n "${SYNC_JOBS:-}" ]]; then
  MAX_JOBS="$SYNC_JOBS"
elif command -v nproc >/dev/null 2>&1; then
  MAX_JOBS=$(( $(nproc) * 2 ))
else
  MAX_JOBS=16
fi
(( MAX_JOBS < 1 )) && MAX_JOBS=1
JOBS_RUNNING=0

spawn_cp() {
  cp "$1" "$2" &
  JOBS_RUNNING=$((JOBS_RUNNING + 1))
  if (( JOBS_RUNNING >= MAX_JOBS )); then
    wait -n
    JOBS_RUNNING=$((JOBS_RUNNING - 1))
  fi
}

drain_cp() {
  wait
  JOBS_RUNNING=0
}

# ── 01_Character → CharacterPortrait ──────────────────────────────
SRC_CHAR="01_Character"
DST_CHAR="CharacterPortrait"

if [ ! -d "$SRC_CHAR" ]; then
  echo "ERROR: $SRC_CHAR 폴더가 없습니다."
  exit 1
fi

rm -rf "$DST_CHAR"
mkdir -p "$DST_CHAR"

# 포함할 NPC 허용 목록 (NPC_Portrait_ 뒤 부분, 대소문자 무시, 확장자 제외)
# 글롭 패턴(*, ?) 사용 가능. 예: Kaitenranger_*
NPC_ALLOW=(
  Arona
  Blacksuit
  Kaitenranger_*
  Maestro
  Momoka
  NP0009
  NP0011_1
  NP0011_2
  NP0013
  NP0014
  NP0015
  NP0029
  NP0030
  NP0032
  NP0033
  NP0035
  NP0037
  NP0038
  NP0040
  NP0076
  NP0079
  NP0090
  NP0095
  NP0097
  NP0098
  NP0099
  NP0101
  NP0102
  NP0108
  NP0109
  NP0110
  NP0111
  NP0112
  NP0113
  NP0114
  NP0115_1
  NP0115_2
  NP0118
  NP0129
  NP0130
  NP0131
  NP0147
  NP0148
  NP0161
  NP0165
  NP0171
  NP0172
  NP0173
  NP0217
  NP0218
  NP0219
  NP0220
  NP0221
  NP0222
  NP0223
  NP0225
  NP0226
  NP0227
  NP0228
  NP0232
  NP0233
  NP0234
  NP0235
  NP0236
  NP0237
  NP0240
  NP0241
  NP0267
  NP0268
  NP0269
  NP0274
  Peroro
  Rin
  Shibasekimaster
  Sora
)

# NPC 허용 목록 소문자로 한 번만 전처리
NPC_ALLOW_LC=()
for allow in "${NPC_ALLOW[@]}"; do
  NPC_ALLOW_LC+=( "${allow,,}" )
done

is_npc_allowed() {
  local name="$1"
  local stem="${name#NPC_Portrait_}"
  stem="${stem%.*}"
  local stem_lc="${stem,,}"
  local allow_lc
  for allow_lc in "${NPC_ALLOW_LC[@]}"; do
    # shellcheck disable=SC2053
    [[ "$stem_lc" == $allow_lc ]] && return 0
  done
  return 1
}

total=0
for f in "$SRC_CHAR"/*; do total=$((total + 1)); done

processed=0
count=0
for f in "$SRC_CHAR"/*; do
  processed=$((processed + 1))
  name="$(basename "$f")"

  draw_progress "$processed" "$total" "CharacterPortrait"

  # .meta 제외
  [[ "$name" == *.meta ]] && continue
  # NPC는 허용 목록에 있을 때만 포함
  if [[ "$name" == NPC_Portrait_* ]]; then
    if ! is_npc_allowed "$name"; then
      continue
    fi
  fi
  # _Small 제외 (확장자 앞)
  [[ "$name" == *_Small.png ]] && continue
  # _Nobody, _Error 제외
  [[ "$name" == *_Nobody.png ]] && continue
  [[ "$name" == *_Error.png ]] && continue

  # Student_Portrait_ / NPC_Portrait_ prefix 제거 + 소문자 변환
  newname="${name#Student_Portrait_}"
  newname="${newname#NPC_Portrait_}"
  newname="${newname,,}"

  spawn_cp "$f" "$DST_CHAR/$newname"
  count=$((count + 1))
done
drain_cp
clear_line
echo "CharacterPortrait: ${count}개 복사 완료 (스캔 ${total}개)"

# ── 11_SchoolIcon → SchoolIcon ────────────────────────────────────
SRC_SCHOOL="11_SchoolIcon"
DST_SCHOOL="SchoolIcon"

if [ ! -d "$SRC_SCHOOL" ]; then
  echo "ERROR: $SRC_SCHOOL 폴더가 없습니다."
  exit 1
fi

rm -rf "$DST_SCHOOL"
mkdir -p "$DST_SCHOOL"

total=0
for f in "$SRC_SCHOOL"/*; do total=$((total + 1)); done

processed=0
count=0
for f in "$SRC_SCHOOL"/*; do
  processed=$((processed + 1))
  name="$(basename "$f")"

  draw_progress "$processed" "$total" "SchoolIcon"

  # .meta 제외
  [[ "$name" == *.meta ]] && continue

  # School_Icon_ prefix 제거 + 소문자 변환
  newname="${name#School_Icon_}"
  newname="${newname,,}"

  spawn_cp "$f" "$DST_SCHOOL/$newname"
  count=$((count + 1))
done
drain_cp
clear_line
echo "SchoolIcon: ${count}개 복사 완료 (스캔 ${total}개)"

echo "완료!"
