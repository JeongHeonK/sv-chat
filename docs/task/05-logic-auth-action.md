# Task: 05-logic-auth-action

## Issue Title
[Logic] 로그인/회원가입 Form Action 서버 로직

## Phase
Phase 2 — 인증

## Worktree
Logic (Opus)

## Depends On
- 04-feat-auth-system

## Target
SvelteKit Form Actions를 통한 로그인/회원가입 서버사이드 처리 로직 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 로그인 성공/실패 Form Action 유닛 테스트 (Red)
- [ ] 회원가입 성공/중복 이메일 Form Action 유닛 테스트 (Red)
- [ ] Form validation 에러 케이스 테스트 — 이메일 형식, 비밀번호 규칙 (Red)
- [ ] 비 로그인 상태 접근 시 리다이렉션 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 로그인 Form Action 구현 (`+page.server.ts`)
- [ ] 회원가입 Form Action 구현
- [ ] Form validation 서버사이드 검증
- [ ] 비 로그인 상태 리다이렉션 로직 (`hooks.server.ts`) → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] validation 로직 공통 유틸 분리
- [ ] 에러 응답 타입 통일
