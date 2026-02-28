# Task: 02-chore-setup-tdd

## Issue Title
Vitest 및 Playwright 테스트 환경 구축

## Phase
Phase 1 — 프로젝트 초기화

## Worktree
Control (Main)

## Depends On
- 01-chore-init-project

## Target
Vitest 설정(컴포넌트 테스트용 `@testing-library/svelte` 포함) 및 루트 렌더링 검증용 Dummy 단위 테스트 1개 작성.

## DoD (Definition of Done)
- [ ] Vitest + `@testing-library/svelte` 설치 및 설정
- [ ] Playwright 브라우저 테스트 환경 설정
- [ ] `vitest.config.ts` — `requireAssertions: true` 설정
- [ ] Dummy 단위 테스트 1개 작성 → `pnpm test` Green 확인

> TDD 인프라 구축 태스크 — 이후 모든 태스크의 Red-Green 사이클 기반
