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
- [ ] 방 멤버가 아닌 사용자의 메시지 전송 시 403 에러 테스트 (Red)
- [ ] 저장된 메시지의 createdAt이 서버 타임스탬프(DB `now()`) 기준인지 확인 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] `+page.server.ts` Form Action으로 메시지 DB 저장
- [ ] 저장 후 Socket.io `emit`으로 해당 Room에 Broadcasting — 페이로드에 서버 생성 `createdAt` 포함 → 테스트 Green 확인
- [ ] Form Action에서 메시지 저장 전 `assertRoomMember` 호출로 권한 검증
- [ ] 메시지 Insert 시 `createdAt`을 DB 서버 시간(`sql\`now()\``) 사용

### REFACTOR — 코드 정리
- [ ] 저장-브로드캐스트 로직 분리 (트랜잭션 보장 검토), 권한 검증은 Task 09의 `assertRoomMember` 재사용
