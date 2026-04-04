// Canvas 2D Export Module
const Exporter = (() => {
  const CARD_W = 1920;
  const CARD_H = 1080;
  let templateImg = null;

  function preloadTemplate() {
    return new Promise((resolve, reject) => {
      templateImg = new Image();
      templateImg.onload = () => resolve();
      templateImg.onerror = () => reject(new Error('Failed to load template'));
      templateImg.src = 'template.png';
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  async function exportPNG(state) {
    if (!templateImg) await preloadTemplate();

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');

    // 1. Draw template background
    ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

    // 2. Set default font
    ctx.font = '22px "GyeonggiTitle", "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#2587ff';
    ctx.textBaseline = 'top';

    // 3. Profile photo — SVG clip-path(#clip-profile) 재현 + 가로 맞춤 세로 중앙
    if (state.profileImage) {
      try {
        const profImg = await loadImage(state.profileImage);
        ctx.save();
        const px = 82, py = 283, pw = 240, ph = 184;
        ctx.beginPath();
        ctx.moveTo(px + 0.16 * pw, py);
        ctx.lineTo(px + 0.96 * pw, py);
        ctx.quadraticCurveTo(px + pw, py, px + 0.995 * pw, py + 0.055 * ph);
        ctx.lineTo(px + 0.885 * pw, py + 0.945 * ph);
        ctx.quadraticCurveTo(px + 0.88 * pw, py + ph, px + 0.84 * pw, py + ph);
        ctx.lineTo(px + 0.04 * pw, py + ph);
        ctx.quadraticCurveTo(px, py + ph, px + 0.005 * pw, py + 0.945 * ph);
        ctx.lineTo(px + 0.115 * pw, py + 0.055 * ph);
        ctx.quadraticCurveTo(px + 0.12 * pw, py, px + 0.16 * pw, py);
        ctx.closePath();
        ctx.clip();
        // CSS: width:100%, height:auto, top:50%, translateY(-50%)
        const scale = pw / profImg.naturalWidth;
        const drawH = profImg.naturalHeight * scale;
        const drawY = py + (ph - drawH) / 2;
        ctx.drawImage(profImg, px, drawY, pw, drawH);
        ctx.restore();
      } catch (e) { /* skip */ }
    }

    // 4. Name - 자동 폰트 축소, 가운데정렬
    if (state.name) {
      const nameX = 326, nameY = 270, nameW = 190, nameH = 42;
      let nfs = 35;
      ctx.font = `bold ${nfs}px "GyeonggiTitle", "Noto Sans KR", sans-serif`;
      while (ctx.measureText(state.name).width > nameW && nfs > 14) {
        nfs--;
        ctx.font = `bold ${nfs}px "GyeonggiTitle", "Noto Sans KR", sans-serif`;
      }
      ctx.textAlign = 'center';
      ctx.fillText(state.name, nameX + nameW / 2, nameY + (nameH - nfs) / 2);
      ctx.textAlign = 'left';
    }

    // 5. Age - 디머
    drawDimmedOptionsCSS(ctx, [
      { name: '성인',    left: 0,   width: 52 },
      { name: '미성년자', left: 70,  width: 94 },
      { name: '비공개',   left: 182, width: 72 }
    ], state.age, 394, 338, 30, 'rgba(215,237,251,0.75)');

    // 6. Gender - 디머
    drawDimmedOptionsCSS(ctx, [
      { name: '남성',  left: 0,   width: 52 },
      { name: '여성',  left: 70,  width: 52 },
      { name: '비공개', left: 140, width: 72 }
    ], state.gender, 394, 378, 30, 'rgba(215,237,251,0.75)');

    // 7. Server - 분리
    drawCheckMark(ctx, state.serverKR, 365, 425);
    if (state.serverKR && state.krCode) {
      ctx.font = 'bold 18px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      ctx.fillText(state.krCode, 523, 422);
    } else if (state.serverKR) {
      // 코드 미입력 디밍
      ctx.fillStyle = 'rgba(215, 237, 251, 0.75)';
      ctx.fillRect(430, 418, 225, 31);
    }
    drawCheckMark(ctx, state.serverJP, 365, 470);
    if (state.serverJP && state.jpCode) {
      ctx.font = 'bold 18px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      ctx.fillText(state.jpCode, 523, 467);
    } else if (state.serverJP) {
      ctx.fillStyle = 'rgba(215, 237, 251, 0.75)';
      ctx.fillRect(430, 463, 225, 31);
    }

    // 8. Activity checkboxes - 드래그 확정 좌표
    const activityPositions = [
      [125, 575], [297, 575], [480, 575], [125, 618], [297, 618], [480, 618], [125, 661], [221, 661], [297, 661], [393, 661], [529, 661]
    ];
    const activityLabels = [
      'RT 위주', '마음 위주', '멘션 위주',
      '게임 대화', '일상트', '구독',
      '그림', '글', '영상', '코스프레', '번역'
    ];
    activityLabels.forEach((label, i) => {
      drawCheckMark(ctx, state.activities.includes(label), activityPositions[i][0], activityPositions[i][1]);
    });

    // 9. Message
    if (state.message) {
      ctx.font = '24px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      wrapText(ctx, state.message, 100, 774, 535, 36);
    }

    // 10. Traces
    const tracePositions = {
      'RT': [773, 107, 80, 70],
      '마음': [898, 107, 75, 70],
      '멘션': [1019, 107, 80, 70],
      '선팔': [1135, 107, 90, 70]
    };
    for (const [key, pos] of Object.entries(tracePositions)) {
      if (!state.traces.includes(key)) {
        ctx.fillStyle = 'rgba(242, 250, 253, 0.75)';
        ctx.fillRect(pos[0], pos[1], pos[2], pos[3]);
      }
    }

    // 11. Trace method - 디머
    drawDimmedOptionsCSS(ctx, [
      { name: '조건 없이', left: 0,   width: 100 },
      { name: '가려서',    left: 120, width: 80 }
    ], state.traceMethod, 818, 187, 35, 'rgba(242,250,253,0.75)');

    // 12. FUB/Spoiler/Adult checkboxes
    drawCheckMark(ctx, state.fub, 1421, 80);
    drawCheckMark(ctx, state.spoiler, 1421, 118);
    drawCheckMark(ctx, state.adult, 1421, 156);

    // 13. Farewell checkboxes
    drawCheckMark(ctx, state.farewells.includes('언팔'), 1421, 193);
    drawCheckMark(ctx, state.farewells.includes('블언블'), 1509, 193);
    drawCheckMark(ctx, state.farewells.includes('블락'), 1615, 193);

    // 14. Preferred characters (CSS: 773, 338, 455x95, gap 4, 5열 최대 2행)
    if (state.characters.length > 0) {
      const charBaseX = 773, charBaseY = 338;
      const containerW = 455, containerH = 95;
      const gap = 4;
      const cols = 5;
      const twoRows = state.characters.length > cols;
      const charW = (containerW - (cols - 1) * gap) / cols;
      const charH = twoRows ? (containerH - gap) / 2 : containerH;
      const maxChars = Math.min(state.characters.length, 10);

      for (let i = 0; i < maxChars; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const dx = charBaseX + col * (charW + gap);
        const dy = charBaseY + row * (charH + gap);
        try {
          const charImg = await loadImage(`CharacterPortrait/${state.characters[i].file}`);
          // object-fit: cover + object-position: center center 재현
          const iw = charImg.naturalWidth, ih = charImg.naturalHeight;
          const scale = Math.max(charW / iw, charH / ih);
          const sw = charW / scale, sh = charH / scale;
          const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
          ctx.save();
          // border-radius: 3px
          const r = 3;
          ctx.beginPath();
          ctx.moveTo(dx + r, dy);
          ctx.lineTo(dx + charW - r, dy);
          ctx.arcTo(dx + charW, dy, dx + charW, dy + r, r);
          ctx.lineTo(dx + charW, dy + charH - r);
          ctx.arcTo(dx + charW, dy + charH, dx + charW - r, dy + charH, r);
          ctx.lineTo(dx + r, dy + charH);
          ctx.arcTo(dx, dy + charH, dx, dy + charH - r, r);
          ctx.lineTo(dx, dy + r);
          ctx.arcTo(dx, dy, dx + r, dy, r);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(charImg, sx, sy, sw, sh, dx, dy, charW, charH);
          ctx.restore();
        } catch (e) { /* skip */ }
      }
    }

    // 15. Coupling
    if (state.coupling) {
      ctx.font = '24px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      wrapText(ctx, state.coupling, 1382, 342, 465, 34);
    }

    // 16. Schools - dim unselected (개별 너비 적용)
    let schoolX = 727;
    SCHOOL_DATA.forEach(school => {
      if (!state.schools.includes(school.id)) {
        ctx.fillStyle = 'rgba(232, 246, 255, 0.75)';
        ctx.fillRect(schoolX, 547, school.dimW, 89);
      }
      schoolX += school.dimW;
    });

    // 17. Club
    if (state.club) {
      ctx.font = '24px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      wrapText(ctx, state.club, 773, 739, 1075, 34);
    }

    // 18. Time
    if (state.time) {
      ctx.font = '24px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      wrapText(ctx, state.time, 718, 944, 345, 34);
    }

    // 19. Other genre
    drawCheckMark(ctx, state.otherGenreCheck, 1263, 905);
    if (state.otherGenre) {
      ctx.font = '24px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      wrapText(ctx, state.otherGenre, 1135, 944, 350, 34);
    }

    // 20. Mine
    if (state.mine) {
      ctx.font = '24px "GyeonggiTitle", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#2587ff';
      wrapText(ctx, state.mine, 1555, 944, 290, 34);
    }

    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '블루아카이브_트친소.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // CSS opt-dimmer 좌표를 그대로 사용하는 디머 함수
  function drawDimmedOptionsCSS(ctx, options, selected, parentX, parentY, h, color) {
    if (selected === null) return;
    options.forEach(opt => {
      if (opt.name !== selected) {
        ctx.fillStyle = color || '#f2fafd';
        ctx.fillRect(parentX + opt.left, parentY, opt.width, h);
      }
    });
  }

  function drawSelectableText(ctx, options, selected, x, y, fontSize, separator) {
    ctx.font = `${fontSize}px "GyeonggiTitle", "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';
    let curX = x;

    options.forEach((opt, i) => {
      if (i > 0) {
        ctx.fillStyle = 'rgba(51, 51, 51, 0.3)';
        const sepW = ctx.measureText(separator).width;
        ctx.fillText(separator, curX, y);
        curX += sepW;
      }

      if (selected === opt) {
        ctx.fillStyle = '#2587ff';
      } else {
        ctx.fillStyle = 'rgba(51, 51, 51, 0.25)';
      }
      ctx.fillText(opt, curX, y);
      curX += ctx.measureText(opt).width;
    });
  }

  // CSS 체크마크 재현: 12x17 요소에 border-right/bottom 4px, rotate(40deg)
  // 부모(18x18) 내 left:3, top:-3 위치
  function drawCheckMark(ctx, checked, x, y) {
    if (!checked) return;
    ctx.save();
    // 회전 중심 = 부모(x,y) + 요소 offset(3,-3) + 요소 중심(6, 8.5)
    const cx = x + 3 + 6;
    const cy = y - 3 + 8.5;
    ctx.translate(cx, cy);
    ctx.rotate(40 * Math.PI / 180);
    ctx.fillStyle = '#2a5fad';
    // border-right: x=8..12, y=0..17 → 중심 기준 (2, -8.5, 4, 17)
    ctx.fillRect(2, -8.5, 4, 17);
    // border-bottom: x=0..12, y=13..17 → 중심 기준 (-6, 4.5, 12, 4)
    ctx.fillRect(-6, 4.5, 12, 4);
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = text.split('\n');
    let curY = y;

    for (const line of lines) {
      if (!line) {
        curY += lineHeight;
        continue;
      }

      let currentLine = '';
      for (let i = 0; i < line.length; i++) {
        const testLine = currentLine + line[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          ctx.fillText(currentLine, x, curY);
          currentLine = line[i];
          curY += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        ctx.fillText(currentLine, x, curY);
        curY += lineHeight;
      }
    }
  }

  // Preload on init
  preloadTemplate();

  // 커스텀 폰트 프리로드
  async function ensureFonts() {
    if (document.fonts) {
      const medium = new FontFace('GyeonggiTitle', "url('fonts/경기천년제목_Medium.ttf')", { weight: '500' });
      const bold = new FontFace('GyeonggiTitle', "url('fonts/경기천년제목_Bold.ttf')", { weight: '700' });
      try {
        const [m, b] = await Promise.all([medium.load(), bold.load()]);
        document.fonts.add(m);
        document.fonts.add(b);
      } catch (e) { /* 폰트 로드 실패 시 fallback */ }
      await document.fonts.ready;
    }
  }
  ensureFonts();

  return { exportPNG };
})();
