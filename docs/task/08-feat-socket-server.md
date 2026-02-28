# Task: 08-feat-socket-server

## Issue Title
Socket.io 커스텀 Node 서버 및 Vite Plugin 통합

## Phase
Phase 4 — 실시간 채팅

## Worktree
logic

## Depends On
- 01-chore-init-project
- 04-feat-auth-system

## Target
개발 환경(Vite)과 상용 빌드(adapter-node) 모두에서 동작하는 Socket.io 인스턴스 구축.

## DoD (Definition of Done)
- [ ] Vite Plugin으로 개발 환경 Socket.io 서버 통합
- [ ] `adapter-node` 빌드 시 커스텀 서버에서 Socket.io 동작
- [ ] better-auth 세션 기반 소켓 인증 미들웨어 적용
- [ ] 클라이언트 `connect` 이벤트 성공 반환 테스트 통과
