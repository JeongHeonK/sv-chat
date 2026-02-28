# Task: 17-test-e2e

## Issue Title
Playwright E2E 테스트 시나리오 작성

## Phase
Phase 6 — E2E + 배포

## Worktree
Opus 단독

## Depends On
- 11-logic-socket-receive
- 12-logic-create-room

## Target
로그인 -> 채팅방 진입 -> 메시지 송수신 전체 사용자 플로우를 Playwright로 자동화 검증.

## DoD (Definition of Done)
- [ ] 회원가입 -> 로그인 플로우 E2E 테스트
- [ ] 채팅방 생성 -> 진입 -> 메시지 발송 E2E 테스트
- [ ] 두 사용자 간 실시간 메시지 교환 E2E 테스트
- [ ] 모든 E2E 테스트 Green(Pass) 확인
