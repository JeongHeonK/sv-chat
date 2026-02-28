# Task: 10-logic-send-message

## Issue Title
[Logic] 메시지 저장 Form Action 및 Socket Broadcast

## Phase
Phase 4 — 실시간 채팅

## Worktree
Logic (Opus)

## Depends On
- 09-logic-chat-load

## Target
메시지 DB 저장 및 Socket.io를 통한 Room Broadcast 서버 로직.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 전송 액션 호출 후 DB Insert Count +1 확인 테스트 (Red)
- [ ] 저장 후 Socket.io Room broadcast 이벤트 트리거 테스트 (Red)
- [ ] 빈 메시지 전송 시 거부 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] `+page.server.ts` Form Action으로 메시지 DB 저장
- [ ] 저장 후 Socket.io `emit`으로 해당 Room에 Broadcasting → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 저장-브로드캐스트 로직 분리 (트랜잭션 보장 검토)
