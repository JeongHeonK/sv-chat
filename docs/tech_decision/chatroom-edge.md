# Edge Case 대응 전략 — 1:1 채팅

## 개요

Gemini 리뷰 기반 엣지 케이스 분석. 수용/보류 판단 근거 포함.

## 1. 동시성 및 레이스 컨디션

### 1.1 양방향 동시 메시지 발송

- **문제**: 클라이언트 시계 차이로 메시지 순서 역전
- **대응**: 서버 타임스탬프(`DB now()`) 기준 정렬, broadcast 페이로드에 createdAt 포함
- **적용 Task**: 10-logic-send-message, 11-logic-socket-receive

### 1.2 1:1 방 동시 생성 (Race Condition)

- **문제**: 두 유저가 동시에 방 생성 → SELECT 통과 후 중복 INSERT
- **대응**: 참여자 조합 해시(participantHash)에 DB Unique 제약 + upsert 패턴
- **적용 Task**: 12-logic-create-room

## 2. 네트워크 및 연결 상태

### 2.1 소켓 재연결 시 메시지 갭

- **문제**: 끊김 동안 수신 못한 메시지 유실
- **대응**: reconnect 시 lastMessageTimestamp 기반 sync 이벤트 → 서버가 갭 메시지 반환
- **적용 Task**: 08-feat-socket-server, 11-logic-socket-receive

### 2.2 메시지 전송 실패

- **문제**: DB 저장 실패 또는 소켓 장애
- **대응**: 전송 중 버튼 disable + SvelteKit Form Action 에러 핸들링
- **적용 Task**: 10-ui-message-input

## 3. 보안

### 3.1 채팅방 권한 검증 (URL 변조 방지)

- **문제**: roomId를 URL에 직접 입력하여 비멤버가 접근
- **대응**: Load 함수/Form Action에서 roomUser 테이블 기반 멤버 검증, 비멤버 → 403
- **적용 Task**: 09-logic-chat-load, 10-logic-send-message
- **공통 유틸**: `assertRoomMember(userId, roomId)` 분리

## 4. 성능

### 4.1 대량 메시지 페이지네이션

- **문제**: 메시지 10,000건+ 방 진입 시 성능 저하
- **대응**: cursor 기반 페이지네이션 (createdAt cursor, LIMIT 50)
- **적용 Task**: 09-logic-chat-load

## 5. 보류 항목 (Scope Out)

| 항목 | 보류 근거 |
|------|----------|
| Optimistic UI | Form Action 기반 → 서버 응답 후 표시가 기본. PRD "1초 이내" 충족 시 UX 차이 미미 |
| 재전송 버튼 UI | 과제 규모에서 과도. 에러 toast로 충분 |
| Rate Limiting (도배 방지) | 1:1 채팅에서는 심각한 도배 문제 발생 가능성이 낮다고 판단. 중복 전송 방지에 집중 |
| 읽음 확인 (Read Receipt) | PRD에 명시 없음. unread count(Task 15)로 간접 처리 |
