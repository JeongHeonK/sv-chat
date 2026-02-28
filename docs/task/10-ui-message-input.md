# Task: 10-ui-message-input

## Issue Title
[UI] 메시지 입력 폼 컴포넌트

## Phase
Phase 4 — 실시간 채팅

## Worktree
UI (Antigravity)

## Depends On
- 09-ui-chat-messages

## Target
메시지 입력 및 전송 UI 컴포넌트 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 입력 폼 요소 렌더링 테스트 — 텍스트 Input + 전송 버튼 존재 (Red)
- [ ] 엔터키 입력 시 전송 이벤트 발생 테스트 (Red)
- [ ] 전송 후 입력창 초기화 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] 메시지 입력 폼 UI 구현 (텍스트 입력 + 전송 버튼)
- [ ] 엔터키 전송 지원
- [ ] 전송 후 입력창 초기화 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 접근성 속성 점검 (aria-label, role)
