# Task: 09-ui-chat-messages

## Issue Title
[UI] 메시지 목록 렌더링 컴포넌트

## Phase
Phase 4 — 실시간 채팅

## Worktree
UI (Antigravity)

## Depends On
- 07-ui-room-list

## Target
채팅방의 메시지 목록을 렌더링하는 UI 컴포넌트 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 더미 메시지 데이터 — 발신/수신 구분 렌더링 테스트 (Red)
- [ ] 메시지 버블 — 시간, 발신자 표시 테스트 (Red)
- [ ] 빈 대화방 상태 표시 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 메시지 목록 컴포넌트 (발신/수신 구분 스타일링)
- [ ] 메시지 버블 컴포넌트 (시간, 발신자 표시)
- [ ] 스크롤 영역 기본 레이아웃 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] MessageBubble 서브컴포넌트 분리
- [ ] 시간 포맷 공통 유틸 재사용
