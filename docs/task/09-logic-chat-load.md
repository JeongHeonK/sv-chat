# Task: 09-logic-chat-load

## Issue Title
[Logic] 대화방 메시지 Load 및 Socket Join 로직

## Phase
Phase 4 — 실시간 채팅

## Worktree
logic

## Depends On
- 07-logic-room-list
- 08-feat-socket-server

## Target
특정 Room ID 라우트 접근 시 DB에서 과거 메시지 fetch 및 Socket.io Room Join 로직.

## DoD (Definition of Done)
- [ ] `/chat/[roomId]` 라우트 Load 함수에서 메시지 조회 쿼리 구현
- [ ] Socket.io `socket.join(roomId)` 서버 로직
- [ ] Message 타입 정의 및 export
- [ ] Load 함수 및 socket join 테스트 통과
