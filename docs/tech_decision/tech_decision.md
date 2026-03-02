# Tech Decision — Alicon 채팅 과제

## 프로젝트 개요

1:1 채팅 웹 애플리케이션 (SvelteKit, 기한: 2026-03-02)

### 설계 원칙

> BaaS(Supabase 등) 대신 직접 구현을 선택한 이유

- **제어권 확보 및 Vendor Lock-in 회피**: 특정 클라우드 서비스 종속성을 제거하여, 인프라 비용 최적화나 환경 변화에 유연하게 대응할 수 있는 구조를 지향
- **실시간 통신 최적화**: DB 변경 감지(CDC) 방식의 Realtime보다, Socket.io로 애플리케이션 레벨에서 세밀한 메시징 로직(방별 세션 관리, 낙관적 업데이트 등)을 직접 제어
- **핵심 기술 이해도 입증**: SvelteKit Custom Server 구조와 WebSocket 통합을 직접 구현하여 프레임워크 동작 원리에 대한 깊은 이해를 증명

---

## 1. 프레임워크: SvelteKit 5 (Svelte 5 Runes)

요구사항 명시 → 선택지 없음. 최신 버전(Svelte 5 Runes 문법) 기준으로 구현.

---

## 2. 아키텍처: SvelteKit 단독

| 옵션                 | 검토 결과                              |
| -------------------- | -------------------------------------- |
| Monorepo (Hono 별도) | 오버엔지니어링, SSE 단방향 한계        |
| **SvelteKit 단독**   | 백엔드 포함, WebSocket 지원, 구조 심플 |

```
src/
├── routes/              ← 페이지 + API (SvelteKit 파일 기반 라우팅)
│   ├── api/             ← REST API 엔드포인트
│   └── (chat)/          ← 채팅 관련 라우트 그룹
├── lib/
│   ├── components/      ← 공용 UI 컴포넌트
│   ├── stores/          ← 클라이언트 상태 ($state 기반)
│   ├── utils/           ← 헬퍼 함수
│   └── server/          ← 서버 전용 (클라이언트 import 금지)
│       ├── db/          ← Drizzle 스키마 + DB 연결
│       ├── auth.ts      ← better-auth 설정
│       └── socket/      ← Socket.io 서버 로직
├── hooks.server.ts      ← better-auth 미들웨어
└── app.d.ts             ← App.Locals 타입 선언
```

### 폴더 구조 선택 이유

| 옵션                                      | 검토 결과                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Feature-Sliced Design (FSD)               | SvelteKit 파일 기반 라우팅과 충돌, 1:1 채팅 규모에 과한 레이어 구조 → 탈락                 |
| Atomic Design                             | 컴포넌트 분류 기준이 모호, SvelteKit 컨벤션과 별도 관리 필요 → 탈락                        |
| **SvelteKit 기본 컨벤션 + 도메인별 정리** | `routes/`(라우팅) + `lib/`(공유 코드) 구조를 그대로 활용, 프레임워크 학습 비용 제로 → 선택 |

- **`routes/`**: SvelteKit이 강제하는 파일 기반 라우팅. 페이지와 API를 같은 디렉토리에서 관리하여 응집도 확보
- **`lib/server/`**: `$lib/server` import 시 SvelteKit이 클라이언트 번들에 포함되지 않도록 자동 보장 → 보안성 확보
- **`lib/components/`, `lib/stores/`**: 도메인별 분리 없이 용도별 정리. 채팅 도메인이 1개뿐이므로 feature 분리는 불필요
- **`lib/server/socket/`**: Socket.io 로직을 auth, db와 같은 레벨에 배치하여 서버 전용 코드로 격리

---

## 3. 실시간: Socket.io

| 옵션           | 검토 결과                                            |
| -------------- | ---------------------------------------------------- |
| Supabase       | BaaS 종속, Vendor Lock-in, CDC 방식 제어 한계 → 탈락 |
| MSW            | HTTP 모킹만, 실시간 수신 불가 → 탈락                 |
| SSE            | 단방향, 채팅에 부적합 → 탈락                         |
| WebSocket (ws) | SvelteKit과 충돌 가능, 로컬 개발 불안정 → 탈락       |
| **Socket.io**  | WS 폴백 자동 처리, room 기능 내장, 안정적 → 선택     |

- room 기능으로 1:1 채팅방 구현
- **개발**: Vite plugin `configureServer` 훅으로 httpServer에 Socket.io 부착
- **프로덕션**: adapter-node 빌드 후 커스텀 `server.js`에서 `build/handler.js` import + Socket.io 서버 생성

---

## 4. DB: PostgreSQL + Drizzle

| 옵션           | 검토 결과                                   |
| -------------- | ------------------------------------------- |
| SQLite         | Railway 볼륨 마운트 필요, 프로덕션 안정성 △ |
| **PostgreSQL** | Railway 1클릭 생성, 안정적 → 선택           |
| Turso          | 외부 의존 추가                              |

- 로컬 개발: Docker로 PostgreSQL 실행
- 프로덕션: Railway PostgreSQL 서비스
- ORM: Drizzle (TypeScript 친화적, PostgreSQL 지원)

---

## 5. 인증: better-auth

| 옵션            | 검토 결과                                                 |
| --------------- | --------------------------------------------------------- |
| Supabase Auth   | 외부 서비스 종속, DB 스키마 제어 불가 → 탈락              |
| NextAuth        | SvelteKit 미지원 → 탈락                                   |
| Lucia           | deprecated → 탈락                                         |
| **better-auth** | SvelteKit CLI 지원, 세션 기반, DB 스키마 직접 관리 → 선택 |

- DB 스키마를 Drizzle ORM으로 직접 관리 → 타입 안전성 극대화
- 세션 기반 인증, PostgreSQL 어댑터 지원
- Optional 요구사항(로그인/로그아웃, 비로그인 유도) 충족

---

## 6. CSS: Tailwind CSS 4 + shadcn-svelte

- `@tailwindcss/forms` → input, 메시지 입력창
- `@tailwindcss/typography` → 채팅 메시지 내 URL 렌더링
- shadcn-svelte: headless 컴포넌트, 커스터마이징 용이

---

## 7. 테스트: Vitest (TDD)

유닛/통합 테스트. Playwright는 기한 고려해 제외.

---

## 8. 배포: Railway

| 옵션        | 상시 서버   | 무료     | 난이도 |
| ----------- | ----------- | -------- | ------ |
| Vercel      | ❌ 서버리스 | ✅       | -      |
| **Railway** | ✅          | Trial $5 | 낮음   |
| Fly.io      | ✅          | ✅       | 중간   |
| Render      | ✅          | ✅       | 낮음   |

**Railway 선택 이유**:

- PostgreSQL 서비스 1클릭 생성
- GitHub 연동 자동 배포
- Trial $5 크레딧으로 카드 없이 과제 기간 내 무료 운영
- WebSocket 상시 서버 지원

---

## 9. AI Orchestration: 모델별 강점 기반 분업 개발

각 AI 모델의 강점 영역에 맞춰 작업을 배분하고, Git worktree로 격리된 병렬 개발을 수행한다.

| 역할 | 담당 | 강점 영역 | 작업 범위 |
|------|------|----------|----------|
| **Logic** | Claude Opus | 복잡한 로직 설계, 타입 시스템, 서버 아키텍처 | 서버 로직, DB 쿼리, Socket.io, Auth, API |
| **UI** | Antigravity | UI/UX 구현, 컴포넌트 퍼블리싱, 반응형 디자인 | Svelte 컴포넌트, 레이아웃, 폼, 스타일링 |
| **Orchestrator** | 개발자 | 아키텍처 의사결정, 코드 리뷰, 통합 검증 | Phase 관리, PR 리뷰, 최종 품질 보증 |

### 워크플로우

```
Phase별 통합 브랜치 (feat/phase-N-*)
├── *-logic (Opus worktree)       ← 서버 로직 + API + 타입 정의
└── *-ui (Antigravity worktree)   ← 컴포넌트 + 스타일 + UX
```

1. **공유 타입 계약**: Phase 1에서 Opus가 TypeScript 타입/인터페이스 선행 정의
2. **독립 개발**: Logic/UI가 각자의 worktree에서 Mock 데이터 기반 병렬 작업
3. **통합 + PR**: Phase별 통합 브랜치에서 merge → main PR → E2E 검증

### 선택 이유

- 각 AI 모델의 강점에 맞는 작업 배분 → 품질 극대화
- Git worktree 기반 격리 → 충돌 최소화
- Phase 단위 PR → 점진적 통합 및 검증
- 개발자가 Orchestrator로서 전체 흐름 제어 → 일관성 보장

---

## 10. 디자인 패턴: 선택적 적용

코드베이스 분석 결과, 4가지 패턴을 검토하고 **실제 필요성이 입증된 2가지만 적용**했다. 나머지 2가지는 현재 규모에서 과설계(over-engineering)로 판단하여 의도적으로 보류했다.

### 적용한 패턴

| 패턴 | 적용 대상 | 적용 이유 |
|------|----------|----------|
| **퍼사드 (Facade)** | `ChatService` — 방 생성/메시지 전송 등 서버 로직 통합 | API 라우트와 Socket 핸들러가 DB 트랜잭션, 유효성 검증, 브로드캐스트 등 여러 모듈을 직접 호출하고 있어 결합도가 높았음. 단일 진입점으로 캡슐화하여 핸들러 코드를 얇게 유지 |
| **팩토리 (Factory)** | `MessageFactory` — 소켓 데이터 → 도메인 모델 변환 | `toMessage()` 변환 로직이 소켓 핸들러에 인라인으로 존재. 메시지 타입이 추가될 때 변환 로직을 한 곳에서 관리하기 위해 팩토리로 추출 |

### 보류한 패턴 (의도적 미적용)

| 패턴 | 검토 대상 | 보류 이유 |
|------|----------|----------|
| **전략 (Strategy)** | 메시지 타입별 동적 렌더링 (`svelte:component`) | 현재 메시지 타입이 텍스트 1종뿐. 이미지, 파일, 시스템 메시지 등 실제 타입이 추가되는 시점에 도입해도 늦지 않음. YAGNI 원칙 |
| **옵저버/Pub-Sub** | 소켓 이벤트 → 상태 동기화 분리 | Svelte 5 Runes(`$state`, `$derived`)가 이미 세밀한 반응형 상태 관리를 제공. 별도 Pub-Sub 레이어는 프레임워크와 기능이 중복되어 복잡도만 증가 |

### 판단 기준

- **"지금 필요한가?"**: 현재 코드에서 실제 문제(결합도, 중복)를 해결하는 패턴만 적용
- **"프레임워크가 이미 해결하는가?"**: Svelte 5 Runes의 반응형 시스템이 커버하는 영역은 별도 패턴 불필요
- **"복잡도 대비 이득이 있는가?"**: 메시지 타입 1종에 전략 패턴은 추상화 비용 > 실제 이득

---

## 11. UI/UX 개선

실제 사용 테스트에서 발견된 문제점을 기반으로 UX를 개선했다.

### 버그 수정

| 항목 | 증상 | 원인 | 해결 |
|------|------|------|------|
| Enter 키 submit | 비밀번호 입력 후 Enter가 작동하지 않음 | shadcn-svelte Button 기본 `type="button"` | `type="submit"` 명시 + Enter keydown 핸들러 |
| 안읽음 뱃지 | 채팅방 진입해도 카운트가 유지됨 | `updateLastReadAt()` 미호출 + layout 재실행 누락 | `page.server.ts`에서 호출 + `depends`/`invalidate` 연동 |

### UX 개선

| 항목 | 문제 | 해결 |
|------|------|------|
| 스크롤 단축키 | 스크롤 올린 상태에서 입력칸 복귀가 마우스만 가능 | `Escape` 키로 입력칸 포커스 + 최하단 스크롤 |
| 전송 후 스크롤 | 스크롤 올린 상태에서 전송 시 하단 이동 안됨 | `auto-scroll.ts`에 `scrollToBottom()` 외부 호출 API 추가 |

### 신규 기능

| 항목 | 설명 | 설계 근거 |
|------|------|----------|
| 채팅방 나가기 | `roomUser` 레코드 삭제, 양쪽 모두 나가면 room 자동 삭제 | 1:1 채팅에서 "나가기"는 멤버십 해제로 모델링. cascade 설정 활용 |
| 채팅방 삭제 | room cascade 삭제 + 상대방에게 Socket `room:deleted` 이벤트 | 확인 다이얼로그 필수. 상대방 실시간 반영으로 빈 방 접근 방지 |
| 채팅방 제목 변경 | `roomUser.customName` 컬럼 추가, 사용자별 커스텀 이름 | `null`이면 기존 상대방 이름 유지. 사용자별 독립 설정으로 상대방 영향 없음 |

---

## 최종 스택 요약

| 영역         | 선택                           |
| ------------ | ------------------------------ |
| Framework    | SvelteKit 5 (Svelte 5 Runes)   |
| Architecture | SvelteKit 단독                 |
| Realtime     | Socket.io                      |
| Database     | PostgreSQL                     |
| ORM          | Drizzle                        |
| Auth         | better-auth                    |
| CSS          | Tailwind CSS 4 + shadcn-svelte |
| Test         | Vitest                         |
| Adapter      | @sveltejs/adapter-node         |
| Deploy       | Railway                        |
