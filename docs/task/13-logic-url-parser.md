# Task: 13-logic-url-parser

## Issue Title
[Logic] URL 정규식 파서 함수

## Phase
Phase 5 — 부가 기능

## Worktree
logic

## Depends On
- 09-logic-chat-load

## Target
텍스트 내 URL 패턴을 감지하는 정규식 유틸리티 함수 구현.

## DoD (Definition of Done)
- [ ] URL 패턴 정규식 구현 (http/https, www)
- [ ] 텍스트를 파싱하여 일반 텍스트/URL 세그먼트 배열로 변환하는 함수
- [ ] 엣지 케이스 처리 (괄호 내 URL, 마침표 뒤 URL 등)
- [ ] 파서 함수 유닛 테스트 통과
