# Task: 04-feat-auth-system

## Issue Title
better-auth 서버 연동 및 인증 미들웨어 작성 (API)

## Phase
Phase 2 — 인증

## Worktree
logic

## Depends On
- 03-feat-setup-db

## Target
SvelteKit `hooks.server.ts` 내에 better-auth 연동, Auth DB 스키마 생성, 로그인 API 테스트 검증.

## DoD (Definition of Done)
- [ ] better-auth 설치 및 SvelteKit 통합 설정
- [ ] Auth 관련 DB 스키마 생성 (session, account 등)
- [ ] `hooks.server.ts`에 인증 미들웨어 작성
- [ ] 회원가입/로그인/로그아웃 API 엔드포인트 구현
- [ ] Vitest 테스트에서 유효한 세션 Mocking 시 인증 통과 로직 정상 동작
