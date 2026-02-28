# Task: 05-ui-auth-form

## Issue Title
[UI] 로그인/회원가입 폼 컴포넌트

## Phase
Phase 2 — 인증

## Worktree
UI (Antigravity) — `--port 5174`로 개발 서버 구동

## Depends On
- 04-feat-auth-system (공유 타입)

## Target
shadcn-svelte를 활용한 로그인/회원가입 폼 UI 컴포넌트 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 로그인 폼 요소 렌더링 테스트 — 이메일/비밀번호 Input, 전송 버튼 존재 (Red)
- [ ] 회원가입 폼 요소 렌더링 테스트 (Red)
- [ ] 클라이언트 validation 에러 메시지 표시 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 로그인 페이지 UI 컴포넌트 구현 (shadcn-svelte)
- [ ] 회원가입 페이지 UI 컴포넌트 구현
- [ ] 클라이언트사이드 Form validation 피드백 (에러 메시지 표시)
- [ ] 로그인 성공 시 메인 페이지 전환 UX → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 공통 폼 필드 컴포넌트 추출 검토
- [ ] 접근성 속성 점검 (label, aria)

## Sync
> Logic worktree에서 Auth 스키마/타입이 변경되면, UI worktree에서 `git pull` 후 타입 재생성 필요.
