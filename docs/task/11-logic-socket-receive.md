# Task: 11-logic-socket-receive

## Issue Title
[Logic] 소켓 메시지 수신 리스너 및 상태 관리

## Phase
Phase 4 — 실시간 채팅

## Worktree
Logic (Opus)

## Depends On
- 10-logic-send-message

## Target
클라이언트 Socket.io 수신 리스너 구현 및 `$state` 기반 메시지 배열 관리.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] Mock 소켓 수신 시 `$state` 배열에 메시지 추가 테스트 (Red)
- [ ] 동일 ID 메시지 중복 수신 방지 테스트 (Red)
- [ ] 수신 메시지 타입 검증 테스트 (Red)
- [ ] 수신 메시지 삽입 시 서버 타임스탬프(`createdAt`) 기준 정렬 유지 테스트 (Red)
- [ ] 소켓 재연결 시 `sync` 이벤트 발행 → 갭 메시지 수신 후 배열 병합 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 클라이언트 Socket.io 수신 리스너 구현
- [ ] 수신 메시지를 `$state` 배열에 추가 로직
- [ ] 중복 메시지 방지 처리 (idempotency key) → 테스트 Green 확인
- [ ] 메시지 배열 삽입 시 `createdAt` 기준 정렬 유지
- [ ] `socket.io.on('reconnect')` 리스너에서 마지막 메시지 `createdAt`으로 `sync` 이벤트 발행, 응답 갭 메시지 배열 병합

### REFACTOR — 코드 정리
- [ ] 소켓 이벤트 타입 enum/const 정리
- [ ] 소켓 연결 모듈 분리 (`$lib/socket.ts`) — 재연결 동기화 로직 포함
- [ ] 정렬 삽입 유틸 함수 분리
