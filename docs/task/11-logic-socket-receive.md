# Task: 11-logic-socket-receive

## Issue Title
[Logic] 소켓 메시지 수신 리스너 및 상태 관리

## Phase
Phase 4 — 실시간 채팅

## Worktree
logic

## Depends On
- 10-logic-send-message

## Target
클라이언트 Socket.io 수신 리스너 구현 및 `$state` 기반 메시지 배열 관리.

## DoD (Definition of Done)
- [ ] 클라이언트 Socket.io 수신 리스너 구현
- [ ] 수신 메시지를 `$state` 배열에 추가 로직
- [ ] 중복 메시지 방지 처리
- [ ] Mocking 소켓 수신 시 상태 업데이트 테스트 통과
