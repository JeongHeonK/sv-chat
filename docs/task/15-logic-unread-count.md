# Task: 15-logic-unread-count

## Issue Title
[Logic] 안읽음 메시지 카운트 쿼리 및 읽음 추적

## Phase
Phase 5 — 부가 기능

## Worktree
logic

## Depends On
- 11-logic-socket-receive

## Target
각 채팅방의 마지막 읽은 시점 기준 안읽음 카운트 계산 로직.

## DoD (Definition of Done)
- [ ] 마지막 읽음 시점(lastReadAt) 추적 스키마/로직 구현
- [ ] 채팅방별 안읽음 메시지 카운트 쿼리 구현
- [ ] 채팅방 입장 시 읽음 시점 갱신 로직
- [ ] 안읽음 카운트 유닛 테스트 통과
