# AGENTS.md

## Commit Convention

Conventional Commits 형식에 맞게 분할하여 커밋할 것.
커밋 설명은 한국어로 작성할 것.

```
<type>(<scope>): <description>
```

### Type

| type | 설명 |
|------|------|
| feat | 새 기능 추가 |
| fix | 버그 수정 |
| style | 좌표 조정, 색상/폰트 등 시각적 변경 (로직 변경 없음) |
| refactor | 코드 리팩토링 (기능 변경 없음) |
| chore | 빌드, 설정, 스크립트 등 기타 작업 |
| docs | 문서 변경 |
| debug | 디버그 도구 관련 |

### Examples

```
feat(font): 경기천년제목 커스텀 폰트 추가
style(profile): 이름 영역 좌표 조정
fix(export): 체크마크 Canvas 렌더링 수정
style(trace): 디머 색상 rgba(242,250,253,0.75)로 변경
chore(coords): apply-coords.js 자식 셀렉터 매칭 버그 수정
debug: 드래그 에디터 리사이즈 핸들 추가
docs: README 작성
```

## Tech Notes

- 빌드 도구 없음 (Vanilla HTML/CSS/JS)
- 좌표계: 1920x1080 (template.png 기준)
- 디버그 모드: 로컬 전용 (`?debug`)
- 커스텀 폰트: `fonts/경기천년제목_Bold.ttf`, `fonts/경기천년제목_Medium.ttf`

## 공통 스킬

CSS의 시각적 속성을 변경할 때는 `.agents/skills/sync-coords/SKILL.md`를 읽고 Canvas 출력 및 좌표 동기화 스크립트에 반영할 것.

## Git 작업

사용자가 명시적으로 푸시를 요청하기 전까지 원격 저장소에 푸시하지 말 것.
