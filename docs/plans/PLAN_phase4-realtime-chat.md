# Phase 4: 실시간 채팅 서버 실행 계획

## 프로젝트 컨텍스트

| 항목 | 내용 |
|------|------|
| Tech Stack | SvelteKit 5 (Svelte 5 Runes), Socket.io, PostgreSQL + Drizzle ORM, better-auth, Tailwind CSS 4 |
| Architecture | SvelteKit 파일 기반 라우팅, `$lib/server/` 서버 전용 모듈, Drizzle 스키마 중심 타입 추론 |
| Testing | Vitest (client: browser-playwright, server: node), requireAssertions: true |
| Adapter | @sveltejs/adapter-node (커스텀 서버 필요) |

## 현재 코드베이스 상태

- **DB 스키마**: `room`, `roomUser`, `message` 테이블 정의 완료 (`chat.schema.ts`)
- **Auth**: better-auth 세션 기반 인증, `hooks.server.ts`에서 세션 resolve
- **Routes**: `(app)/` 보호 라우트 존재, `/chat/[roomId]` 미구현
- **Socket.io**: 미설치, 미설정
- **Message 서비스**: 미구현

## 팀 구성

| # | 역할 | 담당자명 | 핵심 책임 |
|---|------|---------|----------|
| 1 | Team Lead | team-lead | 작업 분해, 위임, 통합, 최종 검증 |
| 2 | Backend Developer | implementer | Socket.io 통합, 메시지 CRUD, 소켓 이벤트 핸들링 구현 |
| 3 | Code Reviewer | reviewer | 구현 완료 시 코드 품질 검증, 테스트 실행, best practice 리뷰 |

## 실행 계획

### Wave 1: Foundation — Socket.io 서버 통합
> 목표: 개발/프로덕션 환경에서 동작하는 Socket.io 인스턴스 + 세션 인증

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| Socket.io 패키지 설치 | implementer | `package.json` 업데이트 | socket.io, socket.io-client 설치 |
| Vite Plugin 작성 | implementer | `src/lib/server/socket/` 모듈 | dev 환경에서 소켓 연결 성공 |
| adapter-node 커스텀 서버 | implementer | `server.js` (빌드용) | prod 빌드에서 소켓 동작 |
| better-auth 소켓 인증 미들웨어 | implementer | 인증 미들웨어 | 유효 세션만 connect 허용, 무효 세션 거부 |
| sync 이벤트 핸들러 | implementer | `$lib/server/socket/sync.ts` | 재연결 시 갭 메시지 반환 |
| TDD 테스트 (Task 08) | implementer | `__tests__/socket.spec.ts` | connect 성공, 인증 실패 거부, sync 이벤트 테스트 통과 |
| **Wave 1 리뷰** | reviewer | 리뷰 리포트 | 코드 품질 + 테스트 + lint 통과 확인 |

### Wave 2: Core — 메시지 Load + Room Join
> 의존: Wave 1 완료
> 목표: `/chat/[roomId]` 라우트에서 메시지 조회 + Socket Room 참여

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| `/chat/[roomId]` 라우트 생성 | implementer | `+page.server.ts`, `+page.svelte` | 라우트 접근 가능 |
| 메시지 조회 쿼리 | implementer | `$lib/server/messages/queries.ts` | cursor 기반 페이지네이션 (50건) |
| Room 멤버 검증 | implementer | `assertRoomMember` 유틸 | 비멤버 접근 시 403 |
| socket.join(roomId) | implementer | 소켓 이벤트 핸들러 | Load 시 해당 Room join |
| Message 타입 export | implementer | `$lib/types/message.ts` | 클라이언트/서버 공유 타입 |
| TDD 테스트 (Task 09) | implementer | 테스트 파일 | 메시지 반환, join, 에러, 403, 페이지네이션 통과 |
| **Wave 2 리뷰** | reviewer | 리뷰 리포트 | 코드 품질 + 테스트 + lint 통과 확인 |

### Wave 3: Core — 메시지 전송 + Broadcast
> 의존: Wave 2 완료 (assertRoomMember 재사용)
> 목표: Form Action으로 메시지 저장 + Socket.io Room broadcast

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| Form Action 메시지 저장 | implementer | `+page.server.ts` action | DB Insert 성공, createdAt = DB now() |
| Socket.io Room broadcast | implementer | broadcast 로직 | 저장 후 해당 Room에 emit |
| 권한 검증 | implementer | assertRoomMember 재사용 | 비멤버 전송 시 403 |
| 빈 메시지 거부 | implementer | 유효성 검증 | 빈 content 시 fail(400) |
| TDD 테스트 (Task 10) | implementer | 테스트 파일 | Insert +1, broadcast, 거부, 403, 타임스탬프 테스트 통과 |
| **Wave 3 리뷰** | reviewer | 리뷰 리포트 | 코드 품질 + 테스트 + lint 통과 확인 |

### Wave 4: Integration — 클라이언트 소켓 수신
> 의존: Wave 3 완료
> 목표: 클라이언트 소켓 리스너 + $state 기반 실시간 메시지 관리

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| 소켓 연결 모듈 | implementer | `$lib/socket.ts` | 클라이언트 소켓 인스턴스 관리 |
| 수신 리스너 + $state 관리 | implementer | 컴포넌트/훅 | 수신 메시지 배열 추가 |
| 중복 방지 | implementer | idempotency 로직 | 동일 ID 메시지 무시 |
| createdAt 기준 정렬 | implementer | 정렬 삽입 유틸 | 타임스탬프 순서 유지 |
| 재연결 sync | implementer | reconnect 핸들러 | 갭 메시지 병합 |
| 소켓 이벤트 타입 정의 | implementer | 타입 파일 | enum/const 이벤트명 |
| TDD 테스트 (Task 11) | implementer | 테스트 파일 | 추가, 중복, 타입, 정렬, sync 테스트 통과 |
| **Wave 4 리뷰** | reviewer | 리뷰 리포트 | 코드 품질 + 테스트 + lint 통과 확인 |

### Wave 5: Polish — 최종 검증
> 의존: Wave 4 완료
> 목표: 전체 통합 검증 + 커밋 + PR

| Task | 담당 | 산출물 | 완료 기준 |
|------|------|--------|----------|
| 전체 테스트 실행 | reviewer | 테스트 결과 | `pnpm test` 전체 통과 |
| 전체 lint + type check | reviewer | 검증 결과 | `pnpm validate` 통과 |
| 최종 코드 리뷰 | reviewer | 종합 리포트 | best practice 준수 확인 |
| 커밋 + PR 생성 | team-lead | PR | feat/phase-4-logic → main |

## 리스크 & 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| Vite Plugin과 adapter-node 이중 구조 복잡성 | 높음 | dev/prod 분기를 명확히 분리, 각 환경 별도 테스트 |
| Socket.io 세션 인증 — better-auth 쿠키 파싱 | 중간 | better-auth의 `getSession` API를 소켓 핸드쉐이크에서 활용 |
| 브라우저 테스트에서 Socket.io 모킹 | 중간 | Vitest server project에서 서버 로직 테스트, 클라이언트는 mock socket |
| 재연결 시 메시지 갭 동기화 정확성 | 중간 | lastMessageTimestamp 기반 cursor 쿼리 + 중복 ID 필터 |

## 체크리스트

- [ ] Wave 1: Socket.io 서버 동작 + 인증 + 테스트 통과
- [ ] Wave 2: 메시지 Load + Room Join + 테스트 통과
- [ ] Wave 3: 메시지 전송 + Broadcast + 테스트 통과
- [ ] Wave 4: 클라이언트 수신 + $state 관리 + 테스트 통과
- [ ] Wave 5: 전체 테스트 + lint + type check 통과
- [ ] feat/phase-4-logic 브랜치에서 PR 생성
