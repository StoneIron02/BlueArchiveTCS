---
description: style.css 변경사항을 export.js와 apply-coords.js에 동기화합니다. 좌표, 색상, 폰트, 디밍 로직 등 모든 시각적 변경을 포함합니다.
user-invocable: true
---

# CSS → export.js / apply-coords.js 동기화

css/style.css가 변경되었을 때, js/export.js의 Canvas 렌더링과 apply-coords.js의 매핑 로직을 일치시킵니다.

**좌표뿐 아니라 다음 항목도 모두 동기화 대상입니다:**
- 좌표 (left, top, width, height)
- 폰트 크기 (font-size → ctx.font)
- 색상 (background, color → ctx.fillStyle, ctx.strokeStyle)
- 디머 방식 변경 (opt-dimmer 구조, 색상, 투명도)
- 체크마크 스타일 (border 두께, 색상 → drawCheckMark의 lineWidth, strokeStyle)
- 새 오버레이 추가/제거 시 export.js와 apply-coords.js 모두 반영

## 동기화 절차

1. `css/style.css`를 읽어서 변경된 `#ov-*` 속성을 파악
2. `js/export.js`를 읽어서 해당 값과 비교 → 차이 수정
3. `apply-coords.js`를 읽어서 매핑 로직이 현재 export.js 코드 패턴과 일치하는지 확인 → 차이 수정

## export.js 좌표 매핑

| CSS ID | export.js 위치 |
|--------|---------------|
| `ov-profile-photo` | `const px, py, pw, ph` |
| `ov-name` | `const nameX, nameY, nameW, nameH` |
| `ov-age` | `drawDimmedOptions(ctx, ['성인'...], state.age, x, y, w, h, color)` |
| `ov-gender` | `drawDimmedOptions(ctx, ['남성'...], state.gender, x, y, w, h, color)` |
| `ov-server-*-check` | `drawCheckMark(ctx, state.serverKR/JP, x, y)` |
| `ov-server-*-dim` | `ctx.fillRect(x, y, w, h)` (서버 코드 디밍) |
| `ov-server-*-code` | `ctx.fillText(state.krCode/jpCode, x, y)` + `ctx.font` |
| `ov-activity-N` | `activityPositions` 배열의 N번째 `[x, y]` |
| `ov-message` | `wrapText(ctx, state.message, x, y+4, w, lineH)` + `ctx.font` |
| `ov-trace-rt/heart/mention/follow` | `tracePositions` 객체의 `[x, y, w, h]` + dimmer `ctx.fillStyle` |
| `ov-trace-method` | `drawDimmedOptions(ctx, ['조건 없이'...], ..., x, y, w, h)` |
| `ov-fub/spoiler/adult` | `drawCheckMark(ctx, state.fub/spoiler/adult, x, y)` |
| `ov-farewell-*` | `drawCheckMark(ctx, state.farewells.includes('...'), x, y)` |
| `ov-characters` | `const charX = left+4, charY = top+4` |
| `ov-coupling` | `wrapText(ctx, state.coupling, x, y+4, w, ...)` |
| `ov-schools` | `schoolStartX`, `schoolLogoW = width / 12`, `fillRect(..., top, ..., height)` + dimmer color |
| `ov-club` | `wrapText(ctx, state.club, x, y+4, w, ...)` |
| `ov-time` | `wrapText(ctx, state.time, x, y+4, w, ...)` |
| `ov-other-genre-check` | `drawCheckMark(ctx, state.otherGenreCheck, x, y)` |
| `ov-other-genre` | `wrapText(ctx, state.otherGenre, x, y+4, w, ...)` |
| `ov-mine` | `wrapText(ctx, state.mine, x, y+4, w, ...)` |

## apply-coords.js 매핑

apply-coords.js의 `exportMap` 객체에 각 ID별 교체 로직이 정의되어 있습니다.
- 새 오버레이가 추가되면 exportMap에도 해당 항목 추가
- export.js의 코드 패턴이 변경되면 (예: `drawSelectableText` → `drawDimmedOptions`) regex도 갱신
- CSS 블록 매칭 regex가 자식 셀렉터(`.opt-dimmer`, `.school-dimmer` 등)를 건드리지 않는지 확인

## 동기화 체크리스트

- [ ] 좌표 (left/top/width/height) 일치
- [ ] 폰트 크기 일치 (CSS font-size ↔ export.js ctx.font)
- [ ] 디머 색상 일치 (CSS background ↔ export.js ctx.fillStyle)
- [ ] 체크마크 스타일 일치 (CSS border ↔ export.js lineWidth/strokeStyle)
- [ ] 서버 dim 영역 일치
- [ ] apply-coords.js의 regex가 현재 export.js 패턴과 매칭
