# Phase 4 — 채팅 UI 컴포넌트 실행 계획

## 프로젝트 컨텍스트

| 항목 | 내용 |
|------|------|
| Tech Stack | SvelteKit 5 (Svelte 5 Runes), Socket.io, Tailwind CSS 4 + shadcn-svelte |
| Architecture | SvelteKit 파일 기반 라우팅, `$lib/components/` 공용 컴포넌트, `$lib/chat/` 채팅 전용 |
| Testing | Vitest + vitest-browser-svelte (browser-playwright), TDD (RED→GREEN→REFACTOR) |
| 현재 상태 | `+page.svelte`에 기본 메시지 렌더링 존재, 소켓 연동 완료, message-store 구현 완료 |

## 팀 구성

| # | 역할 | 담당자명 | 핵심 책임 |
|---|------|---------|----------|
| 1 | Svelte 5 Frontend Dev | messages-dev | Task 09: 메시지 목록 + 버블 컴포넌트 (TDD) |
| 2 | Svelte 5 Frontend Dev | input-dev | Task 10: 입력 폼 컴포넌트 + Task 11: 자동 스크롤 (TDD) |

> **구성 근거**: 3개 UI 태스크, 모두 Svelte 5 프론트엔드. Task 09/10은 독립 컴포넌트로 병렬 가능. Task 11은 스크롤 컨테이너(09)와 메시지 추가(10) 모두 필요하므로 Wave 2에 배치.

## 실행 계획

### Wave 1: 독립 컴포넌트 구현 (병렬)
> 목표: MessageList/MessageBubble과 MessageInput을 독립 컴포넌트로 TDD 구현

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| 09-ui 메시지 목록 | messages-dev | `MessageList.svelte`, `MessageBubble.svelte`, 테스트 | RED→GREEN→REFACTOR 완료, 발신/수신 구분, 빈 상태, 시간 포맷 |
| 10-ui 입력 폼 | input-dev | `MessageInput.svelte`, 테스트 | RED→GREEN→REFACTOR 완료, 엔터키 전송, 전송 후 초기화, submitting disabled |

**병렬 가능 근거**: MessageList와 MessageInput은 각각 독립 Svelte 컴포넌트. props 인터페이스만 `ChatMessage` 타입 공유.

### Wave 2: 자동 스크롤 + 페이지 통합
> 의존: Wave 1 완료
> 목표: 스크롤 로직 구현 + +page.svelte에 전체 통합

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| 11-ui 자동 스크롤 | input-dev | 스크롤 유틸 + 테스트 | RED→GREEN→REFACTOR 완료, 최하단 자동 이동, 위로 스크롤 시 비활성화 |
| 페이지 통합 | messages-dev | `+page.svelte` 업데이트 | Wave 1 컴포넌트 + 스크롤 로직 통합, 기존 소켓 연동 유지 |

### Wave 3: 검증 + 커밋
> 의존: Wave 2 완료
> 목표: 전체 테스트 통과, lint clean, 커밋

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| 전체 검증 | team-lead | `pnpm validate` + `pnpm test` 통과 | 타입체크, lint, 전체 테스트 Green |
| 커밋 + PR | team-lead | `/git-commit` + `/git-create-pr` | feat/phase-4-ui → main PR 생성 (issue #8 연결) |

## 컴포넌트 인터페이스 (사전 합의)

```typescript
// MessageList.svelte props
{ messages: ChatMessage[], currentUserId: string }

// MessageBubble.svelte props
{ message: ChatMessage, isMine: boolean }

// MessageInput.svelte props
{ roomId: string, disabled?: boolean }
```

## 기존 코드 참조

| 파일 | 역할 | 참고 |
|------|------|------|
| `src/routes/(app)/chat/[roomId]/+page.svelte` | 현재 페이지 — 리팩토링 대상 | 소켓 연동 + message-store 이미 구현 |
| `src/lib/chat/message-store.svelte.ts` | 메시지 상태 관리 | `$state`, addMessage, mergeMessages |
| `src/lib/types/chat.ts` | ChatMessage 타입 | id, roomId, senderId, content, createdAt, senderName |
| `src/routes/(app)/__tests__/room-list.svelte.spec.ts` | 테스트 패턴 참조 | vitest-browser-svelte render 패턴 |

## 리스크 & 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| 스크롤 테스트의 브라우저 환경 의존성 | 중간 | vitest-browser-playwright에서 실제 DOM 스크롤 동작 검증 |
| Wave 1 병렬 시 +page.svelte 충돌 | 낮음 | Wave 1에서는 독립 컴포넌트만 생성, 페이지 수정은 Wave 2에서 단일 담당 |
| use:enhance + Socket.io 이중 메시지 | 중간 | form action은 서버 저장 + broadcast, 소켓은 수신만 — 기존 패턴 유지 |

## 체크리스트

- [ ] Wave 1: MessageList + MessageBubble 테스트 통과
- [ ] Wave 1: MessageInput 테스트 통과
- [ ] Wave 2: 자동 스크롤 테스트 통과
- [ ] Wave 2: +page.svelte 통합 완료
- [ ] Wave 3: `pnpm validate` clean
- [ ] Wave 3: `pnpm test` 전체 Green
- [ ] Wave 3: `/git-commit` + `/git-create-pr` (issue #8)
