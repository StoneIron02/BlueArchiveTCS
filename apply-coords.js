#!/usr/bin/env node
/**
 * 드래그 에디터에서 복사한 좌표 CSS를 style.css와 export.js에 자동 반영
 *
 * 사용법:
 *   node apply-coords.js < coords.txt
 *   node apply-coords.js "붙여넣은 CSS 문자열"
 *
 * 입력 형식 (드래그 에디터 출력):
 *   #ov-name { left: 280px; top: 238px; width: 220px; height: 35px; }
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, 'css', 'style.css');
const EXPORT_PATH = path.join(__dirname, 'js', 'export.js');

// ── 입력 읽기 ──
let input = '';
if (process.argv[2]) {
  input = process.argv[2];
} else {
  input = fs.readFileSync(0, 'utf8');
}

// ── 좌표 파싱 ──
const coords = {};
const dimmerCoords = {}; // { 'ov-age': { '성인': { left, width }, ... }, ... }
const re = /#([\w-]+)\s*\{\s*left:\s*(\d+)px;\s*top:\s*(\d+)px;\s*width:\s*(\d+)px;\s*height:\s*(\d+)px;\s*\}/g;
const dimmerRe = /#([\w-]+)\s+\.opt-dimmer\[data-opt="([^"]+)"\]\s*\{\s*left:\s*(\d+)px;\s*width:\s*(\d+)px;\s*\}/g;
let m;
while ((m = re.exec(input)) !== null) {
  coords[m[1]] = { left: +m[2], top: +m[3], width: +m[4], height: +m[5] };
}
while ((m = dimmerRe.exec(input)) !== null) {
  if (!dimmerCoords[m[1]]) dimmerCoords[m[1]] = {};
  dimmerCoords[m[1]][m[2]] = { left: +m[3], width: +m[4] };
}

const totalCount = Object.keys(coords).length + Object.values(dimmerCoords).reduce((s, o) => s + Object.keys(o).length, 0);
if (totalCount === 0) {
  console.error('유효한 좌표를 찾지 못했습니다.');
  process.exit(1);
}

console.log(`${Object.keys(coords).length}개 요소 + ${totalCount - Object.keys(coords).length}개 디머 좌표 파싱 완료`);

// ══════════════════════════════════════
// style.css 업데이트
// ══════════════════════════════════════
let css = fs.readFileSync(CSS_PATH, 'utf8');

// 긴 ID부터 처리하고, ID 경계를 word-boundary(\b)로 엄격 매칭
const sortedIds = Object.keys(coords).sort((a, b) => b.length - a.length);

for (const id of sortedIds) {
  const c = coords[id];
  // #id 직후 공백이나 { 가 오는 단독 셀렉터만 매칭
  // 자식 셀렉터(#id .child, #id[attr] 등)는 제외
  const blockRe = new RegExp(`#${id}\\s*\\{([^}]*?)\\}`, 'g');

  css = css.replace(blockRe, (match, body) => {
    // 셀렉터 부분에 공백이 있으면 자식 셀렉터 → 건너뜀
    const selPart = match.substring(0, match.indexOf('{')).trim();
    if (selPart.includes(' ') || selPart.includes('.') || selPart.includes('[')) {
      return match; // 자식/복합 셀렉터는 건드리지 않음
    }
    let result = match;
    result = result.replace(/left:\s*\d+px/, `left: ${c.left}px`);
    result = result.replace(/top:\s*\d+px/, `top: ${c.top}px`);
    result = result.replace(/width:\s*\d+px/, `width: ${c.width}px`);
    result = result.replace(/height:\s*\d+px/, `height: ${c.height}px`);
    return result;
  });
}

// opt-dimmer 자식 셀렉터 업데이트
for (const [parentId, opts] of Object.entries(dimmerCoords)) {
  for (const [optName, c] of Object.entries(opts)) {
    const dimRe = new RegExp(
      `#${parentId}\\s+\\.opt-dimmer\\[data-opt="${optName}"\\]\\s*\\{([^}]*?)\\}`
    );
    css = css.replace(dimRe, (match, body) => {
      let result = match;
      result = result.replace(/left:\s*\d+px/, `left: ${c.left}px`);
      result = result.replace(/width:\s*\d+px/, `width: ${c.width}px`);
      return result;
    });
  }
}

fs.writeFileSync(CSS_PATH, css);
console.log('✓ css/style.css 업데이트 완료');

// ══════════════════════════════════════
// export.js 업데이트
// ══════════════════════════════════════
let ejs = fs.readFileSync(EXPORT_PATH, 'utf8');

const exportMap = {
  'ov-profile-photo': (c) => {
    ejs = ejs.replace(
      /const px = \d+, py = \d+, pw = \d+, ph = \d+/,
      `const px = ${c.left}, py = ${c.top}, pw = ${c.width}, ph = ${c.height}`
    );
  },

  'ov-name': (c) => {
    // 가운데정렬: fillText(name, x + w/2, y + offset)
    ejs = ejs.replace(
      /const nameX = \d+, nameY = \d+, nameW = \d+, nameH = \d+/,
      `const nameX = ${c.left}, nameY = ${c.top}, nameW = ${c.width}, nameH = ${c.height}`
    );
  },

  'ov-age': (c) => {
    ejs = ejs.replace(
      /\], state\.age, \d+, \d+, \d+,/,
      `], state.age, ${c.left}, ${c.top}, ${c.height},`
    );
  },

  'ov-gender': (c) => {
    ejs = ejs.replace(
      /\], state\.gender, \d+, \d+, \d+,/,
      `], state.gender, ${c.left}, ${c.top}, ${c.height},`
    );
  },

  'ov-server-kr-check': (c) => {
    ejs = ejs.replace(
      /drawCheckMark\(ctx, state\.serverKR, \d+, \d+\)/,
      `drawCheckMark(ctx, state.serverKR, ${c.left}, ${c.top})`
    );
  },

  'ov-server-kr-code': (c) => {
    ejs = ejs.replace(
      /ctx\.fillText\(state\.krCode, \d+, \d+\)/,
      `ctx.fillText(state.krCode, ${c.left}, ${c.top + 4})`
    );
  },

  'ov-server-kr-dim': (c) => {
    ejs = ejs.replace(
      /(\/\/ 코드 미입력 디밍\s*\n\s*ctx\.fillStyle = '[^']*';\s*\n\s*)ctx\.fillRect\(\d+, \d+, \d+, \d+\);(\s*\}\s*drawCheckMark\(ctx, state\.serverJP)/,
      `$1ctx.fillRect(${c.left}, ${c.top}, ${c.width}, ${c.height});$2`
    );
  },

  'ov-server-jp-check': (c) => {
    ejs = ejs.replace(
      /drawCheckMark\(ctx, state\.serverJP, \d+, \d+\)/,
      `drawCheckMark(ctx, state.serverJP, ${c.left}, ${c.top})`
    );
  },

  'ov-server-jp-code': (c) => {
    ejs = ejs.replace(
      /ctx\.fillText\(state\.jpCode, \d+, \d+\)/,
      `ctx.fillText(state.jpCode, ${c.left}, ${c.top + 4})`
    );
  },

  'ov-server-jp-dim': (c) => {
    ejs = ejs.replace(
      /(} else if \(state\.serverJP\) \{\s*\n\s*ctx\.fillStyle = '[^']*';\s*\n\s*)ctx\.fillRect\(\d+, \d+, \d+, \d+\);/,
      `$1ctx.fillRect(${c.left}, ${c.top}, ${c.width}, ${c.height});`
    );
  },

  'ov-message': (c) => {
    ejs = ejs.replace(
      /wrapText\(ctx, state\.message, \d+, \d+, \d+/,
      `wrapText(ctx, state.message, ${c.left}, ${c.top + 4}, ${c.width}`
    );
  },

  'ov-trace-rt': (c) => {
    ejs = ejs.replace(/'RT': \[\d+, \d+, \d+, \d+\]/, `'RT': [${c.left}, ${c.top}, ${c.width}, ${c.height}]`);
  },
  'ov-trace-heart': (c) => {
    ejs = ejs.replace(/'마음': \[\d+, \d+, \d+, \d+\]/, `'마음': [${c.left}, ${c.top}, ${c.width}, ${c.height}]`);
  },
  'ov-trace-mention': (c) => {
    ejs = ejs.replace(/'멘션': \[\d+, \d+, \d+, \d+\]/, `'멘션': [${c.left}, ${c.top}, ${c.width}, ${c.height}]`);
  },
  'ov-trace-follow': (c) => {
    ejs = ejs.replace(/'선팔': \[\d+, \d+, \d+, \d+\]/, `'선팔': [${c.left}, ${c.top}, ${c.width}, ${c.height}]`);
  },

  'ov-trace-method': (c) => {
    ejs = ejs.replace(
      /\], state\.traceMethod, \d+, \d+, \d+,/,
      `], state.traceMethod, ${c.left}, ${c.top}, ${c.height},`
    );
  },

  'ov-fub': (c) => {
    ejs = ejs.replace(/drawCheckMark\(ctx, state\.fub, \d+, \d+\)/, `drawCheckMark(ctx, state.fub, ${c.left}, ${c.top})`);
  },
  'ov-spoiler': (c) => {
    ejs = ejs.replace(/drawCheckMark\(ctx, state\.spoiler, \d+, \d+\)/, `drawCheckMark(ctx, state.spoiler, ${c.left}, ${c.top})`);
  },
  'ov-adult': (c) => {
    ejs = ejs.replace(/drawCheckMark\(ctx, state\.adult, \d+, \d+\)/, `drawCheckMark(ctx, state.adult, ${c.left}, ${c.top})`);
  },

  // farewell — regex에 한글 리터럴이 있어서 서로 절대 충돌 불가
  'ov-farewell-unfollow': (c) => {
    ejs = ejs.replace(
      /drawCheckMark\(ctx, state\.farewells\.includes\('언팔'\), \d+, \d+\)/,
      `drawCheckMark(ctx, state.farewells.includes('언팔'), ${c.left}, ${c.top})`
    );
  },
  'ov-farewell-blockunblock': (c) => {
    ejs = ejs.replace(
      /drawCheckMark\(ctx, state\.farewells\.includes\('블언블'\), \d+, \d+\)/,
      `drawCheckMark(ctx, state.farewells.includes('블언블'), ${c.left}, ${c.top})`
    );
  },
  'ov-farewell-block': (c) => {
    ejs = ejs.replace(
      /drawCheckMark\(ctx, state\.farewells\.includes\('블락'\), \d+, \d+\)/,
      `drawCheckMark(ctx, state.farewells.includes('블락'), ${c.left}, ${c.top})`
    );
  },

  'ov-characters': (c) => {
    ejs = ejs.replace(/const charX = \d+/, `const charX = ${c.left + 4}`);
    ejs = ejs.replace(/const charY = \d+/, `const charY = ${c.top + 4}`);
  },

  'ov-coupling': (c) => {
    ejs = ejs.replace(
      /wrapText\(ctx, state\.coupling, \d+, \d+, \d+/,
      `wrapText(ctx, state.coupling, ${c.left}, ${c.top + 4}, ${c.width}`
    );
  },

  'ov-schools': (c) => {
    ejs = ejs.replace(/let schoolX = \d+/, `let schoolX = ${c.left}`);
    ejs = ejs.replace(
      /ctx\.fillRect\(schoolX, \d+, school\.dimW, \d+\)/,
      `ctx.fillRect(schoolX, ${c.top}, school.dimW, ${c.height})`
    );
  },

  'ov-club': (c) => {
    ejs = ejs.replace(
      /wrapText\(ctx, state\.club, \d+, \d+, \d+/,
      `wrapText(ctx, state.club, ${c.left}, ${c.top + 4}, ${c.width}`
    );
  },

  'ov-time': (c) => {
    ejs = ejs.replace(
      /wrapText\(ctx, state\.time, \d+, \d+, \d+/,
      `wrapText(ctx, state.time, ${c.left}, ${c.top + 4}, ${c.width}`
    );
  },

  'ov-other-genre-check': (c) => {
    ejs = ejs.replace(
      /drawCheckMark\(ctx, state\.otherGenreCheck, \d+, \d+\)/,
      `drawCheckMark(ctx, state.otherGenreCheck, ${c.left}, ${c.top})`
    );
  },

  'ov-other-genre': (c) => {
    ejs = ejs.replace(
      /wrapText\(ctx, state\.otherGenre, \d+, \d+, \d+/,
      `wrapText(ctx, state.otherGenre, ${c.left}, ${c.top + 4}, ${c.width}`
    );
  },

  'ov-mine': (c) => {
    ejs = ejs.replace(
      /wrapText\(ctx, state\.mine, \d+, \d+, \d+/,
      `wrapText(ctx, state.mine, ${c.left}, ${c.top + 4}, ${c.width}`
    );
  },
};

// activity 체크박스 매핑
for (let i = 0; i <= 10; i++) {
  exportMap[`ov-activity-${i}`] = ((idx) => (c) => {
    const arrRe = /const activityPositions = \[([\s\S]*?)\];/;
    const arrMatch = ejs.match(arrRe);
    if (arrMatch) {
      const entries = arrMatch[1].match(/\[\d+,\s*\d+\]/g);
      if (entries && entries[idx]) {
        entries[idx] = `[${c.left}, ${c.top}]`;
        ejs = ejs.replace(arrRe, `const activityPositions = [\n      ${entries.join(', ')}\n    ];`);
      }
    }
  })(i);
}

// opt-dimmer → drawDimmedOptionsCSS 옵션 좌표 동기화
for (const [parentId, opts] of Object.entries(dimmerCoords)) {
  for (const [optName, c] of Object.entries(opts)) {
    // { name: '옵션', left: N, width: N } 형식 매칭
    const dwRe = new RegExp(`name:\\s*'${optName}',\\s*left:\\s*\\d+,\\s*width:\\s*\\d+`);
    ejs = ejs.replace(dwRe, `name: '${optName}', left: ${c.left}, width: ${c.width}`);
  }
}

// 긴 ID부터 적용 (부분 매칭 방지)
let applied = 0;
const sortedExportIds = Object.keys(coords).sort((a, b) => b.length - a.length);
for (const id of sortedExportIds) {
  if (exportMap[id]) {
    exportMap[id](coords[id]);
    applied++;
  } else {
    console.warn(`  ⚠ export 매핑 없음: ${id}`);
  }
}

fs.writeFileSync(EXPORT_PATH, ejs);
console.log(`✓ js/export.js 업데이트 완료 (${applied}개 매핑 적용)`);
console.log('\n완료! 브라우저에서 Ctrl+Shift+R로 확인하세요.');
