# Task: 12-ui-room-search

## Issue Title
[UI] 사용자 검색 및 대화방 생성 UI

## Phase
Phase 5 — 부가 기능

## Worktree
UI (Antigravity)

## Depends On
- 07-ui-room-list

## Target
사용자 검색 Input 및 검색 결과 표시, 대화방 생성 플로우 UI.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 검색 Input 렌더링 및 debounce 동작 테스트 (Red)
- [ ] 검색 결과 드롭다운 표시 테스트 (Red)
- [ ] 사용자 선택 → 대화방 생성 확인 플로우 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 사용자 검색 Input 컴포넌트 (debounce 적용)
- [ ] 검색 결과 드롭다운/목록 UI
- [ ] 사용자 선택 → 대화방 생성 확인 플로우 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] debounce 로직 공통 유틸 추출
