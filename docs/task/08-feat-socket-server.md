# Task: 08-feat-socket-server

## Issue Title
Socket.io 커스텀 Node 서버 및 Vite Plugin 통합

## Phase
Phase 4 — 실시간 채팅

## Worktree
Logic (Opus)

## Depends On
- 01-chore-init-project
- 04-feat-auth-system

## Target
개발 환경(Vite)과 상용 빌드(adapter-node) 모두에서 동작하는 Socket.io 인스턴스 구축.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] Socket.io 클라이언트 `connect` 이벤트 성공 테스트 (Red)
- [ ] 유효하지 않은 세션으로 소켓 연결 시 거부 테스트 (Red)
- [ ] 소켓 재연결 시 `sync` 이벤트로 `lastMessageTimestamp` 전달 → 갭 메시지 반환 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] Vite Plugin으로 개발 환경 Socket.io 서버 통합
- [ ] `adapter-node` 빌드 시 커스텀 서버에서 Socket.io 동작
- [ ] better-auth 세션 기반 소켓 인증 미들웨어 적용 → 테스트 Green 확인
- [ ] `sync` 이벤트 핸들러 — roomId + lastMessageTimestamp 이후 메시지 DB 조회 후 클라이언트 전송

### REFACTOR — 코드 정리
- [ ] 소켓 이벤트 핸들러 모듈 분리
- [ ] dev/prod 이중 구조 설정 정리
- [ ] 동기화 쿼리를 서버 모듈(`$lib/server/socket/sync.ts`)로 분리
