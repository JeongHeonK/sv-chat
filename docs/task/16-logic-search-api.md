# Task: 16-logic-search-api

## Issue Title
[Logic] 대화 내용 검색 API

## Phase
Phase 5 — 부가 기능

## Worktree
Logic (Opus)

## Depends On
- 09-logic-chat-load

## Target
키워드 기반 메시지 검색 API 엔드포인트 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 키워드 검색 시 매칭 메시지 반환 테스트 (Red)
- [ ] 검색 결과에 방 정보, 메시지 컨텍스트 포함 테스트 (Red)
- [ ] 페이지네이션 동작 테스트 — offset/limit (Red)
- [ ] 매칭 없을 때 빈 배열 반환 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 메시지 검색 API 엔드포인트 구현 (LIKE 또는 Full-text search)
- [ ] 검색 결과에 방 정보, 메시지 컨텍스트 포함
- [ ] 페이지네이션 처리 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 검색 쿼리 최적화 (GIN 인덱스 검토)
