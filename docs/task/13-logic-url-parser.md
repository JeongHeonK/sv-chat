# Task: 13-logic-url-parser

## Issue Title
[Logic] URL 정규식 파서 함수

## Phase
Phase 5 — 부가 기능

## Worktree
Logic (Opus)

## Depends On
- 09-logic-chat-load

## Target
텍스트 내 URL 패턴을 감지하는 정규식 유틸리티 함수 구현.

## DoD (Definition of Done)

### RED — 실패하는 테스트 작성
- [ ] `https://example.com` 포함 텍스트 → URL 세그먼트 분리 테스트 (Red)
- [ ] `http://`, `www.` 프로토콜 변형 감지 테스트 (Red)
- [ ] 엣지 케이스 — 괄호 내 URL, 마침표 뒤 URL, 연속 URL 테스트 (Red)
- [ ] URL 미포함 텍스트 → 일반 텍스트 세그먼트만 반환 테스트 (Red)

### GREEN — 테스트를 통과하는 최소 구현
- [ ] URL 패턴 정규식 구현 (http/https, www)
- [ ] 텍스트를 파싱하여 일반 텍스트/URL 세그먼트 배열로 변환하는 함수 → 테스트 Green 확인

### REFACTOR — 코드 정리
- [ ] 정규식 가독성 개선 (named groups 또는 주석)
- [ ] 파서 함수 공용 모듈 위치 결정 (`$lib/utils/`)
