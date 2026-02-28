# Task: 16-ui-search-messages

## Issue Title
[UI] 대화 내용 검색 UI

## Phase
Phase 5 — 부가 기능

## Worktree
UI (Antigravity)

## Depends On
- 07-ui-room-list

## Target
대화 내용 검색바 및 결과 목록 UI 컴포넌트.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 검색 Input 렌더링 및 debounce 동작 테스트 (Red)
- [ ] 검색 결과 목록 렌더링 테스트 — 메시지 미리보기, 방 이름, 시간 (Red)
- [ ] 검색 결과 클릭 시 해당 대화방 라우팅 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 검색 Input 컴포넌트 (debounce 적용)
- [ ] 검색 결과 목록 UI (메시지 미리보기, 방 이름, 시간)
- [ ] 검색 결과 클릭 시 해당 대화방으로 이동 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 검색 결과 키워드 하이라이팅 정리
