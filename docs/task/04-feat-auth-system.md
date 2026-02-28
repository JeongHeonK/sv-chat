# Task: 04-feat-auth-system

## Issue Title
better-auth 서버 연동 및 인증 미들웨어 작성 (API)

## Phase
Phase 2 — 인증

## Worktree
Logic (Opus)

## Depends On
- 03-feat-setup-db

## Target
SvelteKit `hooks.server.ts` 내에 better-auth 연동, Auth DB 스키마 생성, 로그인 API 테스트 검증.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 유효한 세션 Mock 시 인증 미들웨어 통과 테스트 (Red)
- [ ] 세션 없을 때 인증 미들웨어 차단 테스트 (Red)
- [ ] 회원가입/로그인 API 정상 응답 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] better-auth 설치 및 SvelteKit 통합 설정
- [ ] Auth 관련 DB 스키마 생성 (session, account 등)
- [ ] `hooks.server.ts`에 인증 미들웨어 작성
- [ ] 회원가입/로그인/로그아웃 API 엔드포인트 구현 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] Auth 유틸 함수 분리 (`src/lib/server/auth.ts`)
- [ ] 세션 타입 정의 및 `App.Locals` 타입 확장

## Sync
> Auth 스키마 변경 시 UI worktree에서 `drizzle-kit generate` 재실행 및 타입 동기화 필요.
