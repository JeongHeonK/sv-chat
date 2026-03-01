# Task: 09-logic-chat-load

## Issue Title
[Logic] 대화방 메시지 Load 및 Socket Join 로직

## Phase
Phase 4 — 실시간 채팅

## Worktree
Logic (Opus)

## Depends On
- 07-logic-room-list
- 08-feat-socket-server

## Target
특정 Room ID 라우트 접근 시 DB에서 과거 메시지 fetch 및 Socket.io Room Join 로직.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] `/chat/[roomId]` Load 함수 — 메시지 목록 반환 테스트 (Red)
- [ ] Socket.io `socket.join(roomId)` 호출 테스트 (Red)
- [ ] 존재하지 않는 roomId 접근 시 에러 처리 테스트 (Red)
- [ ] 현재 사용자가 방 멤버가 아닌 roomId 접근 시 403 에러 테스트 (Red)
- [ ] 메시지 cursor 기반 페이지네이션 — before 파라미터로 이전 메시지 로드 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] `/chat/[roomId]` 라우트 Load 함수에서 메시지 조회 쿼리 구현
- [ ] Socket.io `socket.join(roomId)` 서버 로직
- [ ] Message 타입 정의 및 export → 테스트 Green 확인
- [ ] Load 함수에서 roomUser 테이블 기반 멤버 검증 — 비멤버 시 `error(403)` 반환
- [ ] 메시지 조회 시 cursor 기반 페이지네이션 적용 (기본 50건, `before` cursor 파라미터)

### REFACTOR — 코드 정리
- [ ] 메시지 쿼리 함수를 서버 모듈로 분리
- [ ] Message 타입 공유 export 정리
- [ ] 권한 검증 로직을 재사용 가능한 유틸(`assertRoomMember`)로 분리 → Task 10에서 재사용

## Sync
> Message 타입 정의 후 UI worktree에서 타입 참조 가능하도록 브랜치 동기화.
