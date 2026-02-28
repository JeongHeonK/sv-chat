# Task: 13-ui-url-snippet

## Issue Title
[UI] URL 하이퍼링크 렌더링 Snippet

## Phase
Phase 5 — 부가 기능

## Worktree
UI (Antigravity)

## Depends On
- 09-ui-chat-messages

## Target
파싱된 URL 세그먼트를 클릭 가능한 `<a>` 요소로 렌더링하는 Svelte Snippet/컴포넌트.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] URL 세그먼트 → `<a href>` 변환 렌더링 테스트 (Red)
- [ ] `target="_blank"` 및 `rel="noopener noreferrer"` 속성 존재 테스트 (Red)
- [ ] 일반 텍스트 세그먼트는 `<a>` 없이 렌더링 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] URL을 `<a href>` 요소로 변환하는 Svelte Snippet 또는 컴포넌트
- [ ] `target="_blank"` 및 `rel="noopener noreferrer"` 속성 적용
- [ ] URL 스타일링 (색상, 밑줄, hover 효과) → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] Snippet 재사용성 검토 (MessageBubble 내 통합)
