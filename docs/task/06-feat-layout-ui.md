# Task: 06-feat-layout-ui

## Issue Title
채팅 앱 반응형 레이아웃 구조 (Sidebar, Main) 퍼블리싱

## Phase
Phase 3 — 레이아웃 + 방 목록

## Worktree
UI (Antigravity)

## Depends On
- 05-ui-auth-form

## Target
GNB(상단바), 좌측 채팅 목록 공간, 우측 본문 공간으로 이어지는 App Shell 레이아웃 컴포넌트 마크업.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] 데스크탑 뷰포트: Sidebar + Main 분할 영역 존재 테스트 (Red)
- [ ] 모바일 뷰포트: 단일 뷰 구조 테스트 (Red)
- [ ] GNB 상단바 렌더링 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] GNB 상단바 컴포넌트 구현
- [ ] 데스크탑: 좌측 Sidebar + 우측 Main 분할 레이아웃
- [ ] 모바일: 단일 뷰 구조 (리스트 ↔ 대화방 전환) → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 레이아웃 슬롯 구조 정리 (`+layout.svelte`)
- [ ] 반응형 breakpoint 상수화
