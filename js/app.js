// Main Application
const App = (() => {
  // State
  const state = {
    name: '',
    age: null,
    gender: null,
    serverKR: false,
    serverJP: false,
    krCode: '',
    jpCode: '',
    profileImage: null,
    activities: [],
    message: '',
    traces: [],
    traceMethod: null,
    fub: false,
    spoiler: false,
    adult: false,
    farewells: [],
    characters: [],
    coupling: '',
    schools: [],
    club: '',
    time: '',
    otherGenreCheck: false,
    otherGenre: '',
    mine: ''
  };

  function init() {
    setupViewportScaling();
    setupToggleGroups();
    setupServerCheckboxes();
    setupProfileUpload();
    setupActivityCheckboxes();
    setupTextInputs();
    setupTraceToggles();
    setupAccountCheckboxes();
    setupSchoolSelector();
    setupPreviewToggle();
    setupExportButton();
    setupResetButton();
    CharacterSelector.init();
    window.addEventListener('resize', setupViewportScaling);
    updatePreview(); // 초기 상태 동기화

    // 디버그 모드: 로컬 전용, 배포환경 차단
    if (location.search.includes('debug')) {
      const host = location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '' || host.startsWith('192.168.')) {
        document.querySelectorAll('.card-overlay').forEach(el => el.classList.add('debug'));
        setupDebugGrid();
      } else {
        console.warn('디버그 모드는 로컬 환경에서만 사용 가능합니다.');
      }
    }
  }

  function setupViewportScaling() {
    const container = document.getElementById('card-container');
    const viewport = document.getElementById('card-viewport');
    const panel = document.getElementById('preview-panel');

    const availW = panel.clientWidth - 40;
    const availH = window.innerHeight - 60;
    const scale = Math.min(availW / 1920, availH / 1080, 1);

    container.style.transform = `scale(${scale})`;
    viewport.style.width = `${1920 * scale}px`;
    viewport.style.height = `${1080 * scale}px`;
  }

  // Toggle groups (radio-style single select)
  function setupToggleGroups() {
    document.querySelectorAll('.toggle-group:not(.multi)').forEach(group => {
      const field = group.dataset.field;
      group.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const wasActive = btn.classList.contains('active');
          group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
          if (!wasActive) {
            btn.classList.add('active');
            state[field] = btn.dataset.value;
          } else {
            state[field] = null;
          }
          updatePreview();
        });
      });
    });
  }

  // Server checkboxes
  function setupServerCheckboxes() {
    const krCheck = document.getElementById('server-kr');
    const jpCheck = document.getElementById('server-jp');
    const krCode = document.getElementById('input-kr-code');
    const jpCode = document.getElementById('input-jp-code');

    krCheck.addEventListener('change', () => {
      state.serverKR = krCheck.checked;
      krCode.disabled = !krCheck.checked;
      if (!krCheck.checked) { krCode.value = ''; state.krCode = ''; }
      updatePreview();
    });

    jpCheck.addEventListener('change', () => {
      state.serverJP = jpCheck.checked;
      jpCode.disabled = !jpCheck.checked;
      if (!jpCheck.checked) { jpCode.value = ''; state.jpCode = ''; }
      updatePreview();
    });

    krCode.addEventListener('input', () => { state.krCode = krCode.value; updatePreview(); });
    jpCode.addEventListener('input', () => { state.jpCode = jpCode.value; updatePreview(); });
  }

  // Profile photo upload
  function setupProfileUpload() {
    const uploadBtn = document.getElementById('profile-upload-area');
    const fileInput = document.getElementById('profile-file');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        state.profileImage = e.target.result;
        uploadBtn.textContent = file.name;
        uploadBtn.classList.add('has-file');
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  // Activity checkboxes
  function setupActivityCheckboxes() {
    document.querySelectorAll('[data-activity]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const activity = checkbox.dataset.activity;
        if (checkbox.checked) {
          if (!state.activities.includes(activity)) state.activities.push(activity);
        } else {
          state.activities = state.activities.filter(a => a !== activity);
        }
        updatePreview();
      });
    });
  }

  // Text inputs
  function setupTextInputs() {
    const mappings = [
      ['input-name', 'name'],
      ['input-message', 'message'],
      ['input-coupling', 'coupling'],
      ['input-club', 'club'],
      ['input-time', 'time'],
      ['input-other-genre', 'otherGenre'],
      ['input-mine', 'mine']
    ];

    mappings.forEach(([id, field]) => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        state[field] = el.value;
        updatePreview();
      });
    });
  }

  // Trace toggles (multi-select)
  function setupTraceToggles() {
    const group = document.querySelector('.toggle-group.multi[data-field="traces"]');
    group.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          state.traces = state.traces.filter(t => t !== value);
        } else {
          btn.classList.add('active');
          state.traces.push(value);
        }
        updatePreview();
      });
    });
  }

  // Account checkboxes (FUB, spoiler, 18+, farewell)
  function setupAccountCheckboxes() {
    document.getElementById('chk-fub').addEventListener('change', (e) => {
      state.fub = e.target.checked;
      updatePreview();
    });
    document.getElementById('chk-spoiler').addEventListener('change', (e) => {
      state.spoiler = e.target.checked;
      updatePreview();
    });
    document.getElementById('chk-adult').addEventListener('change', (e) => {
      state.adult = e.target.checked;
      updatePreview();
    });
    document.getElementById('chk-other-genre').addEventListener('change', (e) => {
      state.otherGenreCheck = e.target.checked;
      updatePreview();
    });

    document.querySelectorAll('[data-farewell]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const val = checkbox.dataset.farewell;
        if (checkbox.checked) {
          if (!state.farewells.includes(val)) state.farewells.push(val);
        } else {
          state.farewells = state.farewells.filter(f => f !== val);
        }
        updatePreview();
      });
    });
  }

  // School selector
  function setupSchoolSelector() {
    const container = document.getElementById('school-selector');

    SCHOOL_DATA.forEach(school => {
      const div = document.createElement('div');
      div.className = 'school-item';
      div.dataset.schoolId = school.id;
      div.innerHTML = `<img src="SchoolIcon/${school.file}" alt="${school.name}" title="${school.name}">`;

      div.addEventListener('click', () => {
        const idx = state.schools.indexOf(school.id);
        if (idx >= 0) {
          state.schools.splice(idx, 1);
          div.classList.remove('active');
        } else {
          state.schools.push(school.id);
          div.classList.add('active');
        }
        updatePreview();
      });

      container.appendChild(div);
    });
  }

  // Mobile preview toggle
  function setupPreviewToggle() {
    const btn = document.getElementById('btn-toggle-preview');
    const panel = document.getElementById('preview-panel');

    btn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      btn.textContent = panel.classList.contains('collapsed') ? '미리보기 보기' : '미리보기 숨기기';
    });
  }

  // Export button
  function setupExportButton() {
    document.getElementById('btn-export').addEventListener('click', async () => {
      const btn = document.getElementById('btn-export');
      btn.disabled = true;
      btn.textContent = '내보내는 중...';

      try {
        state.characters = CharacterSelector.getSelected();
        await Exporter.exportPNG(state);
      } catch (e) {
        alert('내보내기 실패: ' + e.message);
        console.error(e);
      } finally {
        btn.disabled = false;
        btn.textContent = 'PNG 내보내기';
      }
    });
  }

  // Reset
  function setupResetButton() {
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('모든 입력을 초기화하시겠습니까?')) return;

      // Reset state
      Object.assign(state, {
        name: '', age: null, gender: null,
        serverKR: false, serverJP: false, krCode: '', jpCode: '',
        profileImage: null, activities: [], message: '',
        traces: [], traceMethod: null,
        fub: false, spoiler: false, adult: false, farewells: [],
        coupling: '', schools: [], club: '', time: '',
        otherGenreCheck: false, otherGenre: '', mine: ''
      });

      // Reset form elements
      document.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
      document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
      document.querySelectorAll('.toggle-btn').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.school-item').forEach(el => el.classList.remove('active'));
      document.getElementById('input-kr-code').disabled = true;
      document.getElementById('input-jp-code').disabled = true;
      const uploadBtn = document.getElementById('profile-upload-area');
      uploadBtn.textContent = '사진 업로드';
      uploadBtn.classList.remove('has-file');

      CharacterSelector.reset();
      updatePreview();
    });
  }

  // Update card preview
  function updatePreview() {
    // Name - 자동 폰트 축소
    const nameEl = document.getElementById('ov-name');
    nameEl.textContent = state.name;
    const maxFontSize = 35;
    const minFontSize = 14;
    const nameW = 190;
    let fontSize = maxFontSize;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    while (fontSize > minFontSize) {
      ctx.font = `bold ${fontSize}px "GyeonggiTitle", "Noto Sans KR", sans-serif`;
      if (ctx.measureText(state.name).width <= nameW) break;
      fontSize--;
    }
    nameEl.style.fontSize = fontSize + 'px';

    // Age - 미선택이면 디머 안함(원본 그대로), 선택하면 선택된 것만 hidden
    document.querySelectorAll('#ov-age .opt-dimmer').forEach(d => {
      const show = state.age !== null && state.age !== d.dataset.opt;
      d.classList.toggle('hidden', !show);
    });

    // Gender
    document.querySelectorAll('#ov-gender .opt-dimmer').forEach(d => {
      const show = state.gender !== null && state.gender !== d.dataset.opt;
      d.classList.toggle('hidden', !show);
    });

    // Server - 체크박스 + 코드, 미선택/미입력 시 디밍
    document.getElementById('ov-server-kr-check').classList.toggle('checked', state.serverKR);
    document.getElementById('ov-server-jp-check').classList.toggle('checked', state.serverJP);
    document.getElementById('ov-server-kr-code').textContent = state.krCode;
    document.getElementById('ov-server-jp-code').textContent = state.jpCode;
    // 코드 미입력 시 밑줄 영역 디밍
    document.getElementById('ov-server-kr-dim').style.display = state.krCode ? 'none' : '';
    document.getElementById('ov-server-jp-dim').style.display = state.jpCode ? 'none' : '';

    // Activities
    const activityLabels = [
      'RT 위주', '마음 위주', '멘션 위주',
      '게임 대화', '일상트', '구독',
      '그림', '글', '영상', '코스프레', '번역'
    ];
    activityLabels.forEach((label, i) => {
      const el = document.getElementById(`ov-activity-${i}`);
      el.classList.toggle('checked', state.activities.includes(label));
    });

    // Message
    document.getElementById('ov-message').textContent = state.message;

    // Traces
    const traceMap = { 'RT': 'ov-trace-rt', '마음': 'ov-trace-heart', '멘션': 'ov-trace-mention', '선팔': 'ov-trace-follow' };
    for (const [key, id] of Object.entries(traceMap)) {
      const dimmer = document.getElementById(id).querySelector('.dimmer');
      dimmer.classList.toggle('active', !state.traces.includes(key));
    }

    // Trace method
    document.querySelectorAll('#ov-trace-method .opt-dimmer').forEach(d => {
      const show = state.traceMethod !== null && state.traceMethod !== d.dataset.opt;
      d.classList.toggle('hidden', !show);
    });

    // FUB / Spoiler / Adult
    document.getElementById('ov-fub').classList.toggle('checked', state.fub);
    document.getElementById('ov-spoiler').classList.toggle('checked', state.spoiler);
    document.getElementById('ov-adult').classList.toggle('checked', state.adult);

    // Farewell
    document.getElementById('ov-farewell-unfollow').classList.toggle('checked', state.farewells.includes('언팔'));
    document.getElementById('ov-farewell-blockunblock').classList.toggle('checked', state.farewells.includes('블언블'));
    document.getElementById('ov-farewell-block').classList.toggle('checked', state.farewells.includes('블락'));

    // Characters
    const charContainer = document.getElementById('ov-characters');
    charContainer.innerHTML = '';
    const selectedChars = CharacterSelector.getSelected();
    const twoRows = selectedChars.length > 5;
    const gap = 4;
    const imgWidth = (455 - 4 * gap) / 5;
    const imgHeight = twoRows ? (95 - gap) / 2 : 95;
    selectedChars.forEach(char => {
      const img = document.createElement('img');
      img.src = `CharacterPortrait/${char.file}`;
      img.alt = char.nameKo;
      img.style.width = imgWidth + 'px';
      img.style.height = imgHeight + 'px';
      charContainer.appendChild(img);
    });

    // Coupling
    document.getElementById('ov-coupling').textContent = state.coupling;

    // Schools - show dimmer overlays on unselected
    // This is handled in the card via CSS overlays on the template
    const schoolsContainer = document.getElementById('ov-schools');
    schoolsContainer.innerHTML = '';
    SCHOOL_DATA.forEach(school => {
      const div = document.createElement('div');
      div.className = 'school-dimmer';
      div.style.width = school.dimW + 'px';
      if (state.schools.includes(school.id)) div.classList.add('active');
      schoolsContainer.appendChild(div);
    });

    // Club
    document.getElementById('ov-club').textContent = state.club;

    // Time
    document.getElementById('ov-time').textContent = state.time;

    // Other genre
    document.getElementById('ov-other-genre-check').classList.toggle('checked', state.otherGenreCheck);
    document.getElementById('ov-other-genre').textContent = state.otherGenre;

    // Mine
    document.getElementById('ov-mine').textContent = state.mine;

    // Profile image
    const profOv = document.getElementById('ov-profile-photo');
    if (state.profileImage) {
      if (!profOv.querySelector('img')) {
        profOv.innerHTML = `<img src="${state.profileImage}" alt="프로필">`;
      } else {
        profOv.querySelector('img').src = state.profileImage;
      }
    } else {
      profOv.innerHTML = '';
    }
  }

  function setupDebugGrid() {
    const container = document.getElementById('card-container');
    const SNAP_THRESHOLD = 6; // px 이내 자석 흡착
    const CHECKBOX_IDS = new Set();

    // 체크박스 요소 식별 (17~18px 크기)
    container.querySelectorAll('.card-overlay').forEach(el => {
      const w = parseInt(getComputedStyle(el).width);
      const h = parseInt(getComputedStyle(el).height);
      if (w <= 20 && h <= 20) CHECKBOX_IDS.add(el.id);
    });

    // 격자 캔버스
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 1920;
    gridCanvas.height = 1080;
    gridCanvas.style.cssText = 'position:absolute;top:0;left:0;width:1920px;height:1080px;pointer-events:none;z-index:9998;opacity:0.45;';
    container.appendChild(gridCanvas);
    const gctx = gridCanvas.getContext('2d');
    gctx.strokeStyle = 'rgba(0,150,255,0.2)';
    gctx.lineWidth = 1;
    for (let x = 0; x <= 1920; x += 100) { gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, 1080); gctx.stroke(); }
    for (let y = 0; y <= 1080; y += 100) { gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(1920, y); gctx.stroke(); }
    gctx.font = '11px monospace';
    gctx.fillStyle = 'rgba(0,100,200,0.6)';
    for (let x = 100; x <= 1920; x += 100)
      for (let y = 100; y <= 1080; y += 100)
        gctx.fillText(`${x},${y}`, x + 2, y + 12);

    // 가이드라인 캔버스 (스냅 시 표시)
    const guideCanvas = document.createElement('canvas');
    guideCanvas.width = 1920;
    guideCanvas.height = 1080;
    guideCanvas.style.cssText = 'position:absolute;top:0;left:0;width:1920px;height:1080px;pointer-events:none;z-index:9999;';
    container.appendChild(guideCanvas);
    const guideCtx = guideCanvas.getContext('2d');

    function drawGuides(lines) {
      guideCtx.clearRect(0, 0, 1920, 1080);
      guideCtx.strokeStyle = '#f0f';
      guideCtx.lineWidth = 1;
      guideCtx.setLineDash([6, 4]);
      lines.forEach(l => {
        guideCtx.beginPath();
        if (l.axis === 'x') { guideCtx.moveTo(l.val, 0); guideCtx.lineTo(l.val, 1080); }
        else { guideCtx.moveTo(0, l.val); guideCtx.lineTo(1920, l.val); }
        guideCtx.stroke();
      });
      guideCtx.setLineDash([]);
    }

    // HUD 패널
    const hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;top:8px;right:8px;background:rgba(0,0,0,0.92);color:#0f0;font:12px monospace;padding:10px;border-radius:8px;z-index:10000;max-height:90vh;overflow-y:auto;width:380px;';
    hud.innerHTML =
      '<div id="debug-coord" style="font-size:16px;font-weight:bold;margin-bottom:4px;">x: -- y: --</div>' +
      '<div style="color:#888;font-size:10px;margin-bottom:8px;">드래그=이동 | Shift=축고정 | Ctrl=자석해제 | 모서리=크기조절</div>' +
      '<button id="debug-export-btn" style="background:#0a0;color:#fff;border:none;padding:8px 14px;border-radius:4px;cursor:pointer;font-size:13px;width:100%;">좌표 복사</button>';
    document.body.appendChild(hud);

    // 마우스 좌표
    const coordEl = document.getElementById('debug-coord');
    container.style.pointerEvents = 'auto';
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * 1920 / rect.width);
      const y = Math.round((e.clientY - rect.top) * 1080 / rect.height);
      coordEl.textContent = `x: ${x}  y: ${y}`;
    });

    // 모든 오버레이의 edge 좌표 수집 (현재 요소 제외)
    function getSnapEdges(excludeEl) {
      const edges = { x: [], y: [] };
      container.querySelectorAll('.card-overlay').forEach(other => {
        if (other === excludeEl) return;
        const cs = getComputedStyle(other);
        const ol = parseInt(cs.left), ot = parseInt(cs.top);
        const ow = parseInt(cs.width), oh = parseInt(cs.height);
        edges.x.push(ol, ol + ow); // left, right
        edges.y.push(ot, ot + oh); // top, bottom
      });
      return edges;
    }

    // 스냅 계산
    function snapValue(val, targets) {
      let best = null, bestDist = SNAP_THRESHOLD + 1;
      for (const t of targets) {
        const d = Math.abs(val - t);
        if (d < bestDist) { bestDist = d; best = t; }
      }
      return best;
    }

    // 오버레이 설정
    const overlays = container.querySelectorAll('.card-overlay');

    overlays.forEach(el => {
      const isCheckbox = CHECKBOX_IDS.has(el.id);
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'move';
      el.style.zIndex = '9997';

      // 리사이즈 핸들 8방향 (체크박스 제외)
      if (!isCheckbox) {
        const handles = [
          { dir: 'nw', css: 'top:-4px;left:-4px;cursor:nwse-resize;' },
          { dir: 'n',  css: 'top:-4px;left:50%;margin-left:-4px;cursor:ns-resize;' },
          { dir: 'ne', css: 'top:-4px;right:-4px;cursor:nesw-resize;' },
          { dir: 'e',  css: 'top:50%;margin-top:-4px;right:-4px;cursor:ew-resize;' },
          { dir: 'se', css: 'bottom:-4px;right:-4px;cursor:nwse-resize;' },
          { dir: 's',  css: 'bottom:-4px;left:50%;margin-left:-4px;cursor:ns-resize;' },
          { dir: 'sw', css: 'bottom:-4px;left:-4px;cursor:nesw-resize;' },
          { dir: 'w',  css: 'top:50%;margin-top:-4px;left:-4px;cursor:ew-resize;' },
        ];
        handles.forEach(h => {
          const handle = document.createElement('div');
          handle.style.cssText = `position:absolute;width:8px;height:8px;background:#0af;z-index:9999;border-radius:1px;${h.css}`;
          handle.dataset.resize = h.dir;
          el.appendChild(handle);
        });
      }

      // 드래그 & 리사이즈
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const resizeDir = e.target.dataset && e.target.dataset.resize;
        const rect = container.getBoundingClientRect();
        const scale = rect.width / 1920;
        const startMX = e.clientX, startMY = e.clientY;
        const cStyle = getComputedStyle(el);
        const origL = parseInt(cStyle.left), origT = parseInt(cStyle.top);
        const origW = parseInt(cStyle.width), origH = parseInt(cStyle.height);

        el.style.outline = '3px solid #0f0';
        const edges = getSnapEdges(el);

        const onMove = (ev) => {
          const dx = (ev.clientX - startMX) / scale;
          const dy = (ev.clientY - startMY) / scale;
          const guides = [];

          if (resizeDir && !isCheckbox) {
            // 8방향 리사이즈
            let nL = origL, nT = origT, nW = origW, nH = origH;
            const d = resizeDir;
            const doSnap = !ev.ctrlKey;

            if (d.includes('e')) { nW = Math.max(20, Math.round(origW + dx)); }
            if (d.includes('w')) { nW = Math.max(20, Math.round(origW - dx)); nL = Math.round(origL + dx); }
            if (d.includes('s')) { nH = Math.max(10, Math.round(origH + dy)); }
            if (d.includes('n')) { nH = Math.max(10, Math.round(origH - dy)); nT = Math.round(origT + dy); }

            if (doSnap) {
              if (d.includes('e')) {
                const snapR = snapValue(nL + nW, edges.x);
                if (snapR !== null) { nW = snapR - nL; guides.push({ axis: 'x', val: snapR }); }
              }
              if (d.includes('w')) {
                const snapLv = snapValue(nL, edges.x);
                if (snapLv !== null) { nW += (nL - snapLv); nL = snapLv; guides.push({ axis: 'x', val: snapLv }); }
              }
              if (d.includes('s')) {
                const snapB = snapValue(nT + nH, edges.y);
                if (snapB !== null) { nH = snapB - nT; guides.push({ axis: 'y', val: snapB }); }
              }
              if (d.includes('n')) {
                const snapTv = snapValue(nT, edges.y);
                if (snapTv !== null) { nH += (nT - snapTv); nT = snapTv; guides.push({ axis: 'y', val: snapTv }); }
              }
            }

            el.style.left = nL + 'px';
            el.style.top = nT + 'px';
            el.style.width = nW + 'px';
            el.style.height = nH + 'px';
          } else {
            // 이동
            let newL = Math.round(origL + dx);
            let newT = Math.round(origT + dy);

            // Shift = 축 고정
            if (ev.shiftKey) {
              if (Math.abs(dx) > Math.abs(dy)) newT = origT;
              else newL = origL;
            }

            // 스냅 (Ctrl 누르면 비활성화)
            if (!ev.ctrlKey) {
              const w = origW, h = origH;
              const snapL = snapValue(newL, edges.x);
              const snapR = snapValue(newL + w, edges.x);
              const snapT = snapValue(newT, edges.y);
              const snapB = snapValue(newT + h, edges.y);

              if (snapL !== null) { newL = snapL; guides.push({ axis: 'x', val: snapL }); }
              else if (snapR !== null) { newL = snapR - w; guides.push({ axis: 'x', val: snapR }); }

              if (snapT !== null) { newT = snapT; guides.push({ axis: 'y', val: snapT }); }
              else if (snapB !== null) { newT = snapB - h; guides.push({ axis: 'y', val: snapB }); }
            }

            el.style.left = newL + 'px';
            el.style.top = newT + 'px';
          }

          drawGuides(guides);
        };

        const onUp = () => {
          el.style.outline = '2px solid rgba(255,0,0,0.5)';
          guideCtx.clearRect(0, 0, 1920, 1080);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    // 좌표 복사
    document.getElementById('debug-export-btn').addEventListener('click', () => {
      let css = '/* 드래그로 조정된 좌표 */\n';
      overlays.forEach(el => {
        const s = getComputedStyle(el);
        css += `#${el.id} { left: ${parseInt(s.left)}px; top: ${parseInt(s.top)}px; width: ${parseInt(s.width)}px; height: ${parseInt(s.height)}px; }\n`;
        el.querySelectorAll('.opt-dimmer[data-opt]').forEach(dim => {
          const ds = getComputedStyle(dim);
          css += `#${el.id} .opt-dimmer[data-opt="${dim.dataset.opt}"] { left: ${parseInt(ds.left)}px; width: ${parseInt(ds.width)}px; }\n`;
        });
      });
      navigator.clipboard.writeText(css).then(() => alert('좌표 복사 완료!'))
        .catch(() => { console.log(css); alert('콘솔(F12) 확인'); });
    });
  }

  return { init, updatePreview };
})();

// Start
document.addEventListener('DOMContentLoaded', App.init);
