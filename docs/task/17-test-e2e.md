# Task: 17-test-e2e

## Issue Title
Playwright E2E 테스트 시나리오 작성

## Phase
Phase 6 — E2E + 배포

## Worktree
Control (Main) — Logic/UI 브랜치 병합 후 통합 검증

## Depends On
- 11-logic-socket-receive
- 12-logic-create-room

## Target
로그인 → 채팅방 진입 → 메시지 송수신 전체 사용자 플로우를 Playwright로 자동화 검증.

## DoD (Definition of Done)

### RED — E2E 시나리오 작성 (전체 실패 확인)
- [ ] 회원가입 → 로그인 플로우 E2E 테스트 작성
- [ ] 방 목록 정렬 및 채팅방 생성/검색 플로우 플로우 검증
- [ ] 두 사용자 간 실시간 메시지 교환 및 스크롤 동작 검증 (Autoscroll)
- [ ] 상태 반영 검증 기능 (안읽음 카운트 뱃지 증감 및 입장 시 초기화)
- [ ] URL 포함 메시지 발송 시 링크 스니펫 파싱/렌더링 검증
- [ ] 채팅방 내 메시지 키워드 검색 및 결과 노출 검증

### GREEN — 통합 환경에서 전체 시나리오 통과
- [ ] 모든 E2E 테스트 Green(Pass) 확인
- [ ] CI 환경에서도 재현 가능한 테스트 설정

### REFACTOR — 테스트 정리
- [ ] 테스트 fixture 및 helper 함수 정리
- [ ] 불안정한(flaky) 테스트 안정화
