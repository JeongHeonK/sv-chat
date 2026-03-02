# Phase 5 서버 로직 실행 계획

## 프로젝트 컨텍스트

| 항목 | 내용 |
|------|------|
| Tech Stack | SvelteKit 5, Svelte 5 Runes, Socket.io, PostgreSQL + Drizzle ORM, better-auth, Tailwind CSS 4 |
| Architecture | SvelteKit 파일 기반 라우팅, Form Action + Socket.io (REST API 없음), `$lib/server/` 서버 전용 모듈 |
| Testing | Vitest (server: node, client: browser-playwright), TDD (Red→Green→Refactor), `requireAssertions: true` |
| DB Schema | `room`, `roomUser`, `message` (chat), `user`, `session`, `account`, `verification` (auth) |

## 팀 구성

| # | 역할 | 담당자명 | 핵심 책임 |
|---|------|---------|----------|
| 1 | Backend Dev (SvelteKit/Drizzle) | dev-rooms | Task 12: 사용자 검색 API + 1:1 Room 생성 + 중복 방지 |
| 2 | Backend Dev (SvelteKit/Drizzle) | dev-utility | Task 13: URL 파서 + Task 15: 안읽음 카운트 (스키마 변경 포함) |
| 3 | Backend Dev (SvelteKit/Drizzle) | dev-search | Task 16: 메시지 검색 API + 페이지네이션 |

### 그룹핑 근거
- **dev-rooms**: Task 12는 트랜잭션 + unique constraint + upsert 패턴이 필요한 가장 복잡한 태스크
- **dev-utility**: Task 13(소규모, 순수 함수)과 Task 15(roomUser 스키마 변경)를 묶어 워크로드 균형
- **dev-search**: Task 16은 독립적인 검색 API로 message 테이블만 사용

## 실행 계획

### Wave 1: TDD Red Phase + Schema (병렬)
> 목표: 모든 태스크의 실패 테스트 작성 + Task 15 스키마 변경

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| Task 12 RED: 사용자 검색/방 생성 테스트 | dev-rooms | `src/lib/server/rooms/__tests__/create-room.spec.ts` | 검색 반환, DB Row 확인, 중복 방지 3개 테스트 Red |
| Task 13 Full TDD: URL 파서 | dev-utility | `src/lib/utils/url-parser.ts` + `src/lib/utils/__tests__/url-parser.spec.ts` | https/http/www 감지, 엣지케이스, 미포함 테스트 모두 Green |
| Task 15 Schema: lastReadAt 추가 | dev-utility | `chat.schema.ts` 수정 + 마이그레이션 | roomUser에 lastReadAt 컬럼 추가 |
| Task 16 RED: 메시지 검색 테스트 | dev-search | `src/lib/server/rooms/__tests__/search-messages.spec.ts` | 키워드 매칭, 방 정보 포함, 페이지네이션, 빈 결과 4개 테스트 Red |

### Wave 2: TDD Green + Refactor Phase (병렬)
> 의존: Wave 1 완료 (스키마 변경 반영)
> 목표: 모든 API 구현 + 테스트 통과

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| Task 12 GREEN+REFACTOR: 검색 API + Room 생성 | dev-rooms | `src/routes/api/users/search/+server.ts`, `src/lib/server/rooms/create-room.ts` | 검색 API 동작, Room+RoomUser 생성, 중복 방지(participantHash unique), 트랜잭션 래핑 |
| Task 15 GREEN+REFACTOR: 안읽음 카운트 | dev-utility | `src/lib/server/rooms/unread.ts` | lastReadAt 추적, 카운트 쿼리, 입장 시 갱신, 인덱스 최적화 |
| Task 16 GREEN+REFACTOR: 검색 API | dev-search | `src/routes/api/messages/search/+server.ts` | LIKE/Full-text 검색, 방 정보 포함, offset/limit 페이지네이션, GIN 인덱스 검토 |

### Wave 3: Integration & Validation
> 의존: Wave 2 완료
> 목표: 전체 통합 검증 + 커밋 + PR

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| 전체 테스트 실행 | team-lead | `pnpm test` 통과 | 모든 기존 + 신규 테스트 통과 |
| 타입 체크 + 린트 | team-lead | `pnpm validate` 통과 | 에러 0 |
| 커밋 + PR | team-lead | `feat/phase-5-logic` → `main` PR | Issue #9 참조, 4개 태스크 DoD 완료 |

## 파일 영향 분석

| 파일 | 변경 내용 | 담당 |
|------|----------|------|
| `src/lib/server/db/chat.schema.ts` | roomUser에 lastReadAt 컬럼 추가 | dev-utility |
| `src/lib/server/rooms/create-room.ts` | 신규: Room 생성 + 중복 방지 로직 | dev-rooms |
| `src/lib/server/rooms/unread.ts` | 신규: 안읽음 카운트 쿼리 + 읽음 갱신 | dev-utility |
| `src/lib/utils/url-parser.ts` | 신규: URL 정규식 파서 유틸리티 | dev-utility |
| `src/routes/api/users/search/+server.ts` | 신규: 사용자 검색 API 엔드포인트 | dev-rooms |
| `src/routes/api/messages/search/+server.ts` | 신규: 메시지 검색 API 엔드포인트 | dev-search |

## 리스크 & 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| roomUser 스키마 변경 시 기존 마이그레이션 충돌 | 높음 | dev-utility가 Wave 1에서 스키마 변경 선행, drizzle-kit push로 반영 |
| participantHash unique constraint race condition | 중간 | 트랜잭션 + ON CONFLICT DO NOTHING + 기존 방 반환 upsert 패턴 |
| Full-text search PostgreSQL 설정 의존 | 낮음 | 초기에는 ILIKE 기반, 추후 GIN 인덱스 + tsvector 전환 가능 |
| worktree 간 스키마 파일 충돌 | 중간 | dev-utility가 스키마를 먼저 변경, 다른 에이전트는 Wave 2에서 pull |

## 체크리스트

- [ ] Wave 1: Task 13 URL 파서 완료 (테스트 통과)
- [ ] Wave 1: Task 15 lastReadAt 스키마 추가
- [ ] Wave 1: Task 12, 16 RED 테스트 작성
- [ ] Wave 2: Task 12 검색 API + Room 생성 완료
- [ ] Wave 2: Task 15 안읽음 카운트 쿼리 완료
- [ ] Wave 2: Task 16 메시지 검색 API 완료
- [ ] Wave 3: `pnpm test` 전체 통과
- [ ] Wave 3: `pnpm validate` 클린
- [ ] Wave 3: `feat/phase-5-logic` → `main` PR 생성 (Issue #9)
