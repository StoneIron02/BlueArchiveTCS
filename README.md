# 블루아카이브 트친소 표 생성기

블루아카이브 트위터 자기소개표(트친소)를 웹에서 작성하고 PNG로 내보내는 도구입니다.

## Features

- 템플릿 이미지 위에 각 영역을 웹 UI로 채워넣기
- 프로필 사진 업로드 (클리핑)
- 캐릭터 선택 모달
- 학원 로고 토글 선택
- 나이/성별/조건 등 선택형 항목 디밍 처리
- Canvas 2D API 기반 PNG 내보내기 (1920×1080)
- 모바일 반응형 레이아웃

## Project Structure

```
index.html                 # 메인 페이지
css/style.css              # 스타일시트 (오버레이 좌표 포함)
js/
  app.js                   # 메인 앱 로직
  export.js                # Canvas 2D PNG 내보내기
  character-selector.js    # 캐릭터 선택 모달
  character-data.js        # 캐릭터 한국어 이름 매핑
template.png               # 트친소 템플릿 이미지 (1920×1080)
CharacterPortrait/         # 캐릭터 초상화 이미지
SchoolIcon/                # 학원 로고 이미지
fonts/                     # 커스텀 폰트 (경기천년제목)
apply-coords.js            # 좌표 동기화 스크립트
```

## Development

### Local Server

```bash
npx serve .
```

### Debug Mode

로컬 환경에서 `?debug` 쿼리 파라미터 추가:

```
http://localhost:3000?debug
```

- 100px 격자 + 마우스 좌표 실시간 표시
- 오버레이 드래그 이동/리사이즈
- Shift+드래그: 축 고정
- Ctrl+드래그: 스냅 비활성화
- "좌표 복사" 버튼으로 CSS 좌표 추출

배포 환경에서는 디버그 모드가 비활성화됩니다.

### Coordinate Sync

디버그 모드에서 좌표를 조정한 후:

```bash
# 1. "좌표 복사" 버튼 클릭 → coords.txt에 붙여넣기
# 2. 스크립트 실행
node apply-coords.js < coords.txt
```

`css/style.css`와 `js/export.js`의 좌표가 자동으로 동기화됩니다.

## Tech Stack

- Vanilla HTML/CSS/JS (빌드 도구 없음)
- Canvas 2D API (PNG 내보내기)
- Google Fonts (Noto Sans KR) + 경기천년제목 커스텀 폰트
- GitHub Pages 배포

## Credits

- Template: Made by @SI_kishi
- Game: Blue Archive by NEXON Korea Corp.
