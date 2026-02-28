# Task: 10-logic-send-message

## Issue Title
[Logic] 메시지 저장 Form Action 및 Socket Broadcast

## Phase
Phase 4 — 실시간 채팅

## Worktree
logic

## Depends On
- 09-logic-chat-load

## Target
메시지 DB 저장 및 Socket.io를 통한 Room Broadcast 서버 로직.

## DoD (Definition of Done)
- [ ] `+page.server.ts` Form Action으로 메시지 DB 저장
- [ ] 저장 후 Socket.io `emit`으로 해당 Room에 Broadcasting
- [ ] API 테스트에서 전송 액션 호출 직후 DB Insert Count +1 확인
- [ ] Broadcasting 이벤트 트리거 테스트 통과
