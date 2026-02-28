# Task: 11-ui-chat-scroll

## Issue Title
[UI] 채팅 메시지 실시간 렌더링 및 자동 스크롤

## Phase
Phase 4 — 실시간 채팅

## Worktree
UI (Antigravity)

## Depends On
- 10-ui-message-input

## Target
새 메시지 수신 시 UI 즉시 반영 및 스크롤 최하단 자동 이동.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 새 메시지 추가 시 스크롤 최하단 자동 이동 테스트 (Red)
- [ ] 사용자가 위로 스크롤 중일 때 자동 스크롤 비활성화 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 새 메시지 수신 시 DOM 즉시 추가 렌더링
- [ ] 스크롤 최하단 자동 이동
- [ ] 사용자가 위로 스크롤 중일 때는 자동 스크롤 비활성화 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 스크롤 로직 유틸 함수 분리 (`$effect` 정리)
