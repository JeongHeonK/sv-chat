# Task: 12-logic-create-room

## Issue Title
[Logic] 사용자 검색 API 및 1:1 채팅방 생성 로직

## Phase
Phase 5 — 부가 기능

## Worktree
Logic (Opus)

## Depends On
- 07-logic-room-list

## Target
사용자 검색 API 및 새 1:1 Room + RoomUser 관계 생성 서버 로직.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 사용자 검색 API — 닉네임/이메일 기반 결과 반환 테스트 (Red)
- [ ] 1:1 Room + RoomUser 생성 후 DB Row 존재 확인 테스트 (Red)
- [ ] 이미 존재하는 1:1 대화방 중복 생성 방지 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 사용자 검색 API 엔드포인트 구현 (닉네임/이메일 기반)
- [ ] 1:1 Room 생성 + RoomUser 관계 Insert 로직
- [ ] 중복 대화방 체크 로직 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 검색 쿼리 최적화 (인덱스 검토)
- [ ] Room 생성 로직 트랜잭션 래핑
