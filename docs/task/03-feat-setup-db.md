# Task: 03-feat-setup-db

## Issue Title
PostgreSQL 및 Drizzle ORM 환경 구성 (User, Room, Message 테이블)

## Phase
Phase 1 — 프로젝트 초기화

## Worktree
Control (Main) — 스키마 확정 후 Logic/UI worktree에서 타입 참조

## Depends On
- 01-chore-init-project
- 02-chore-setup-tdd

## Target
로컬 Docker PostgreSQL 띄우기, Drizzle 스키마 파일 생성 및 DB 마이그레이션 모듈 테스트 작성.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] DB 연결 테스트 작성 (연결 실패 상태에서 Red 확인)
- [ ] Dummy 데이터 Insert/Select 테스트 작성 (테이블 미존재 → Red 확인)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] Docker Compose로 PostgreSQL 로컬 환경 구성
- [ ] Drizzle ORM 설치 및 스키마 파일 생성 (User, Room, Message, RoomUser 테이블)
- [ ] `drizzle-kit` 마이그레이션 실행 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 스키마 타입 export 정리 (`$inferSelect` / `$inferInsert`)
- [ ] DB 연결 모듈 분리 (`src/lib/server/db/`)

## Sync
> Phase 1 완료 후 Control에서 Logic/UI worktree로 분기 시, 양쪽 모두 `pnpm install` 및 마이그레이션 상태 동기화 필요.
