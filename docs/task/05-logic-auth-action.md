# Task: 05-logic-auth-action

## Issue Title
[Logic] 로그인/회원가입 Form Action 서버 로직

## Phase
Phase 2 — 인증

## Worktree
logic

## Depends On
- 04-feat-auth-system

## Target
SvelteKit Form Actions를 통한 로그인/회원가입 서버사이드 처리 로직 구현.

## DoD (Definition of Done)
- [ ] 로그인 Form Action 구현 (`+page.server.ts`)
- [ ] 회원가입 Form Action 구현
- [ ] 비 로그인 상태 접근 시 리다이렉션 로직 (`hooks.server.ts`)
- [ ] Form validation 서버사이드 검증 (이메일 형식, 비밀번호 규칙)
- [ ] Form Action 유닛 테스트 통과
