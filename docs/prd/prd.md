# Product Requirements Document (PRD): 1:1 채팅 웹 어플리케이션

## 1. 개요 (Overview)
본 문서는 `Alicon` 1:1 채팅 과제 구현을 위한 SvelteKit 기반 1:1 실시간 채팅 웹 어플리케이션에 대한 제품 요구 사항을 정의합니다. 현재 전용 백엔드 서버가 존재하지 않는 상황을 전제로 하지만, 외부 BaaS(Backend as a Service)에 의존하지 않고 주도적으로 **SvelteKit Custom Server 구조와 WebSocket(Socket.io) 통합을 직접 구현**하여 제어권을 확보하는 것을 부분적인 핵심으로 삼습니다. 또한 전체 사이클 동안 **TDD(Test-Driven Development)** 방법론을 적용하여 안정성 높은 코드를 설계합니다.

## 2. 목표 (Goals)
- 실시간 1:1 메시지 송수신이 가능한 채팅 어플리케이션 구축.
- **TDD (테스트 주도 개발)** 환경을 통해 핵심 비즈니스 로직, UI 컴포넌트 및 소켓/API 계층의 신뢰성 검증.
- 대화 상대별 독립된 채팅방 관리 및 매끄러운 화면 전환(Routing) 경험 제공.
- 외부 종속성을 피한 SvelteKit 단독 풀스택 아키텍처 구현 및 유지보수성 입증.
- Svelte 5 (Runes) 문법과 SvelteKit의 특징(SSR, Load Functions, Form Actions)을 적극 활용.

## 3. 사용자 스토리 (User Stories)
- **Core:** "사용자로서 나는 다른 사용자와 1:1로 실시간 메시지를 주고받을 수 있어야 한다."
- **Core:** "사용자로서 나는 이전 대화 기록을 끊김 없이 다시 열람할 수 있어야 한다."
- **Optional:** "사용자로서 나는 읽지 않은 메시지가 몇 개인지 알 수 있어야 한다."
- **Optional:** "사용자로서 나는 텍스트 내의 웹사이트 링크를 클릭해 바로 이동할 수 있어야 한다."

## 4. 기능 요구 사항 (Functional Requirements)

### 4.1 필수 구현 기능 (Core Features)
1. **사용자 인증 및 인가 (Auth)**
   - 세션 기반의 로그인 / 로그아웃 시스템 구현 (`better-auth` 활용).
   - 비 로그인 상태로 접근 시 로그인 화면으로 리다이렉션.
2. **채팅방 목록 및 네비게이션**
   - 참여 중인 대화 상대별 채팅방 목록 표시 (최근 메시지 순 정렬).
   - 특정 채팅방 클릭 시 해당 대화방으로 원활하게 진입.
3. **실시간 메시지 송수신**
   - 텍스트 입력 후 엔터키 또는 '전송' 버튼을 통한 메시지 발송.
   - 상대방이 보낸 메시지를 실시간(Real-time)으로 렌더링.
4. **대화 내역 영구 보관 및 조회**
   - 주고받은 메시지는 데이터베이스(PostgreSQL)에 영구 저장.
   - 채팅방을 나갔다 다시 들어오거나 새로고침 시에도 이전 대화 내역 조회 가능.

### 4.2 부가 가치 기능 (Optional Features) - 구현 권장
1. **새 대화방 생성 및 검색 기능**
   - 사용자 검색을 통해 새로운 사용자와의 1:1 대화방 개설.
2. **URL 하이퍼링크 파싱 및 활성화**
   - 메시지 내 URL 패턴을 인식하여 Clickable 한 앵커 태그(`<a>`)로 자동 변환.
3. **읽지 않음(Unread) 상태 표시**
   - 읽지 않은 메시지가 존재할 경우 채팅방 목록에서 시각적 표시.
4. **대화 내용 검색 기능**
   - 특정 키워드로 지난 채팅 내역을 검색.
5. **반응형 웹 디자인 (Responsive Design)**
   - 모바일, 태블릿, 데스크탑을 모두 지원하는 적응형 레이아웃 구성.
6. **Production 배포**
   - 외부에서도 접속 가능한 상시 구동 서버에 애플리케이션 프로덕션 빌드 및 배포 완료.

## 5. 아키텍처 및 기술 구현 전략 (Technical Strategies)

본 프로젝트는 BaaS(Supabase, Firebase 등) 방식에 기대거나 무거운 FSD 아키텍처를 도입하는 대신, SvelteKit 프레임워크 자체의 기본 컨벤션을 최대한 따르며 **풀스택 형태(SvelteKit 단독)**로 구현하는 것을 원칙으로 합니다. 

### 5.1 기술 스택
- **Framework:** SvelteKit 5 (Svelte 5 Runes)
- **Architecture:** SvelteKit 단독 (Monorepo 등 오버엔지니어링 배제)
- **Realtime:** Socket.io (WS 폴백 및 방별 관리의 용이함을 위해 채택)
- **Database:** PostgreSQL (로컬은 Docker, 프로덕션은 배포 플랫폼의 DB 서비스 활용)
- **ORM:** Drizzle ORM (타입 안전성 극대화)
- **Auth:** better-auth (SvelteKit 통합 지원, DB 스키마 직접 제어)
- **CSS:** Tailwind CSS v4 + shadcn-svelte (`@tailwindcss/forms`, `@tailwindcss/typography` 활용)
- **Test:** Vitest + Playwright (TDD 기반 유닛, 통합, E2E 테스트)
- **Deploy:** Railway (`@sveltejs/adapter-node` 사용, Socket.io 상시 연결 지원)

### 5.2 개발 방법론: TDD (Test-Driven Development)
기능 구현 시 "테스트 작성 (Red) -> 최소한의 구현 (Green) -> 리팩토링 (Refactor)" 주기를 따릅니다.
- **단위/로직 테스트 (Vitest):** 데이터베이스 쿼리, 사용자 세션 검증(auth), 유틸리티 함수(시간 포맷, URL 파싱 정규식) 등 독립적인 로직 우선 테스트.
- **컴포넌트 테스트 (Vitest):** UI 렌더링 검증, Form Validation, Svelte 5 Runes(`$state`, `$derived`)의 상태 변화 검증.
- **통합/E2E 테스트 (Playwright):** 로그인부터 소켓 접속, 그리고 메시지 실시간 교환까지 실제 브라우저 환경에서의 핵심 목표 시나리오 검증.

### 5.3 백엔드-프론트엔드 모듈 구조화 정책
- `src/routes/`: 웹 페이지 라우팅, 서버사이드 로드 함수(`+page.server.ts`), API 엔드포인트(`+server.ts`).
- `src/lib/components/` & `src/lib/stores/`: 공용 컴포넌트 및 클라이언트 스토어 로직.
- `src/lib/server/`: 서버 전용 코드로 클라이언트 노출 시 에러 발생 보장 처리. DB 연결 객체, Socket 로직, 인증 미들웨어 구조화.

## 6. 화면 흐름 및 디자인 가이드 (UI/UX)
- 시안(이미지)을 베이스로 하되, 애플리케이션의 사용성을 저해하지 않는 선에서 현대적 Chat UI 준수.
- **데스크탑 뷰:** 좌측 분할 영역에 채팅 리스트(Sidebar), 우측 분할 영역에 선택된 채팅방 본문(Main Window) 노출.
- **모바일 뷰:** 단일 컴포넌트 뷰 구조. 기본은 채팅 리스트가 보이며 하나를 클릭 시 대화방 본문으로 라우팅되어 리스트 숨김. 뒤로가기 시 리스트로 이동.

## 7. 프로젝트 주요 이정표 (Milestones)

> AI Orchestration 기반 병렬 개발 — Logic(Opus) / UI(Antigravity) worktree 분리

| Phase | 이름 | Logic (Opus) | UI (Antigravity) | Branch |
|-------|------|-------------|-------------------|--------|
| 1 | 프로젝트 초기화 | 01, 02, 03 | — | `feat/phase-1-init` |
| 2 | 인증 | 04, 05-logic | 05-ui | `feat/phase-2-auth` |
| 3 | 레이아웃 + 방 목록 | 07-logic | 06, 07-ui | `feat/phase-3-layout` |
| 4 | 실시간 채팅 | 08, 09~11-logic | 09~11-ui | `feat/phase-4-chat` |
| 5 | 부가 기능 | 12~13, 15~16-logic | 12~13, 15~16-ui | `feat/phase-5-features` |
| 6 | E2E + 배포 | 17, 14 | — | `feat/phase-6-deploy` |

## 8. 비기능 요구사항 (Non-Functional Requirements)

1. **성능**: 메시지 전송 후 상대방 화면 렌더링까지 체감 지연 1초 이내.
2. **보안**: XSS 방지 (사용자 입력 이스케이핑), CSRF 토큰 적용, 소켓 연결 시 세션 인증 필수.
3. **안정성**: 네트워크 끊김 시 Socket.io 자동 재연결, 중복 메시지 방지 (idempotency key 또는 서버측 dedup).
4. **접근성**: 키보드 네비게이션 지원, 시맨틱 HTML 구조, 적절한 ARIA 속성.
5. **브라우저 호환**: Chrome, Safari, Firefox 최신 2개 버전 지원.
