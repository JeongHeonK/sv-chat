# Task: 15-logic-unread-count

## Issue Title
[Logic] 안읽음 메시지 카운트 쿼리 및 읽음 추적

## Phase
Phase 5 — 부가 기능

## Worktree
Logic (Opus)

## Depends On
- 11-logic-socket-receive

## Target
각 채팅방의 마지막 읽은 시점 기준 안읽음 카운트 계산 로직.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 채팅방별 안읽음 메시지 카운트 반환 테스트 (Red)
- [ ] 채팅방 입장 시 lastReadAt 갱신 후 카운트 0 테스트 (Red)
- [ ] 새 메시지 수신 시 카운트 증가 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 마지막 읽음 시점(lastReadAt) 추적 스키마/로직 구현
- [ ] 채팅방별 안읽음 메시지 카운트 쿼리 구현
- [ ] 채팅방 입장 시 읽음 시점 갱신 로직 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 카운트 쿼리 성능 최적화 (인덱스 검토)
- [ ] lastReadAt 갱신 로직 모듈 분리

## Sync
> lastReadAt 스키마 추가 시 UI worktree에서 타입 동기화 필요.
