# Task: 03-feat-setup-db

## Issue Title
PostgreSQL 및 Drizzle ORM 환경 구성 (User, Room, Message 테이블)

## Phase
Phase 1 — 프로젝트 초기화

## Worktree
Opus 단독

## Depends On
- 01-chore-init-project
- 02-chore-setup-tdd

## Target
로컬 Docker PostgreSQL 띄우기, Drizzle 스키마 파일 생성 및 DB 마이그레이션 모듈 테스트 작성.

## DoD (Definition of Done)
- [ ] Docker Compose로 PostgreSQL 로컬 환경 구성
- [ ] Drizzle ORM 설치 및 스키마 파일 생성 (User, Room, Message, RoomUser 테이블)
- [ ] `drizzle-kit` 마이그레이션 실행 성공
- [ ] TDD 코드로 DB Connect 및 Dummy 데이터 Insert/Select 테스트 통과
