# Task: 07-logic-room-list

## Issue Title
[Logic] 채팅방 목록 Load 함수 및 DB 쿼리

## Phase
Phase 3 — 레이아웃 + 방 목록

## Worktree
logic

## Depends On
- 03-feat-setup-db

## Target
현재 로그인한 유저의 채팅방 목록을 DB에서 조회하는 Load 함수 및 API 구현.

## DoD (Definition of Done)
- [ ] `+page.server.ts` Load 함수에서 유저의 Room 목록 조회 쿼리 구현
- [ ] 최근 메시지 순 정렬 로직
- [ ] Room 타입 정의 및 export
- [ ] Load 함수 유닛 테스트 통과
