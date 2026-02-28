# Task: 15-ui-unread-badge

## Issue Title
[UI] 안읽음 뱃지 UI 컴포넌트

## Phase
Phase 5 — 부가 기능

## Worktree
UI (Antigravity)

## Depends On
- 07-ui-room-list

## Target
RoomList 내 각 채팅방의 안읽음 메시지 뱃지 표시.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 카운트 > 0일 때 뱃지 표시 테스트 (Red)
- [ ] 카운트 0일 때 뱃지 숨김 테스트 (Red)
- [ ] 카운트 > 99일 때 "99+" 표시 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] RoomList 항목에 뱃지 카운트 UI 표시
- [ ] 카운트가 0이면 뱃지 숨김
- [ ] 99+ 초과 시 "99+" 표시 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] Badge 컴포넌트 범용화 검토
