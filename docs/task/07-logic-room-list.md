# Task: 07-logic-room-list

## Issue Title
[Logic] 채팅방 목록 Load 함수 및 DB 쿼리

## Phase
Phase 3 — 레이아웃 + 방 목록

## Worktree
Logic (Opus)

## Depends On
- 03-feat-setup-db

## Target
현재 로그인한 유저의 채팅방 목록을 DB에서 조회하는 Load 함수 및 API 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] Load 함수 — 유저의 Room 목록 반환 테스트 (Red)
- [ ] 최근 메시지 순 정렬 테스트 (Red)
- [ ] 참여 Room이 없을 때 빈 배열 반환 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] `+page.server.ts` Load 함수에서 유저의 Room 목록 조회 쿼리 구현
- [ ] 최근 메시지 순 정렬 로직
- [ ] Room 타입 정의 및 export → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] Room 쿼리 함수를 `src/lib/server/` 모듈로 분리
- [ ] N+1 쿼리 방지 검토
