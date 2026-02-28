# Task: 07-ui-room-list

## Issue Title
[UI] 채팅방 목록 RoomList 컴포넌트

## Phase
Phase 3 — 레이아웃 + 방 목록

## Worktree
UI (Antigravity)

## Depends On
- 06-feat-layout-ui

## Target
채팅방 목록을 표시하는 RoomList 컴포넌트 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] Mock 배열 주입 시 방 목록 올바른 맵핑 렌더링 테스트 (Red)
- [ ] 빈 상태(채팅방 없음) UI 표시 테스트 (Red)
- [ ] 채팅방 클릭 시 라우팅 동작 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] RoomList 컴포넌트 작성 (방 이름, 최근 메시지, 시간 표시)
- [ ] 빈 상태 UI 처리
- [ ] 채팅방 클릭 시 라우팅 처리 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] RoomItem 서브컴포넌트 분리 검토
- [ ] 시간 포맷 유틸 함수 추출
