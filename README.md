# sv-chat

SvelteKit 5 기반 1:1 실시간 채팅 웹 애플리케이션

## 기술 스택

| 영역      | 선택                           |
| --------- | ------------------------------ |
| Framework | SvelteKit 5 (Svelte 5 Runes)   |
| Realtime  | Socket.io                      |
| Database  | PostgreSQL + Drizzle ORM       |
| Auth      | better-auth                    |
| CSS       | Tailwind CSS 4 + shadcn-svelte |
| Test      | Vitest                         |
| Deploy    | Railway (adapter-node)         |

> 기술 선택 배경은 [Tech Decision](./docs/tech_decision/tech_decision.md) 참고

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm
- Docker (로컬 PostgreSQL)

### 설치

```bash
pnpm install
```

### 환경 변수

`.env.example`을 `.env`로 복사 후 값을 설정합니다.

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgres://user:password@localhost:5432/sv-chat"
ORIGIN="http://localhost:5173"
BETTER_AUTH_SECRET="your-secret-key"
```

### DB 설정

```bash
# PostgreSQL 실행 (Docker)
docker run --name sv-chat-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=sv-chat -p 5432:5432 -d postgres

# better-auth 스키마 생성
pnpm auth:schema

# Drizzle 마이그레이션
pnpm drizzle-kit push
```

### 개발 서버

```bash
pnpm dev
```

## 스크립트

| 명령어          | 설명                        |
| --------------- | --------------------------- |
| `pnpm dev`      | 개발 서버                   |
| `pnpm build`    | 프로덕션 빌드               |
| `pnpm validate` | type check + lint 통합 검사 |
| `pnpm test`     | 전체 테스트                 |
| `pnpm format`   | 코드 포맷팅                 |

## Technical Deep Dive

### Svelte 5 Runes 적응

Svelte 5의 Runes 문법(`$state`, `$derived`, `$effect`, `$props`)을 기반으로 반응성 시스템을 구현했습니다. React/Vue 경험과의 멘탈 모델 매핑, Class-based State 패턴으로 도메인 로직을 UI와 분리한 과정은 [Rapid Adaptation](./docs/rapid-adaptation/rapid-adaptation.md)에서 확인할 수 있습니다.

### Socket.io 실시간 통신 설계

SvelteKit의 Vite 개발 서버와 adapter-node 프로덕션 환경 모두에서 Socket.io를 통합하는 이중 구조를 설계했습니다.

- **개발**: Vite `configureServer` 훅으로 httpServer에 Socket.io 부착
- **프로덕션**: 커스텀 `server.js`에서 `build/handler.js` + Socket.io 서버 생성

### 인증 + WebSocket 통합

better-auth 세션 기반 인증과 Socket.io handshake를 연결하여 인증된 사용자만 실시간 채팅에 참여할 수 있는 구조를 구현했습니다. 쿠키 헤더를 `auth.api.getSession()`에 직접 전달하는 방식으로 HTTP 세션과 WebSocket 인증 컨텍스트를 브릿지했습니다.

---

## 프로젝트 구조

```
src/
├── routes/              ← 페이지 + API (파일 기반 라우팅)
├── lib/
│   ├── components/      ← 공용 UI 컴포넌트
│   ├── stores/          ← 클라이언트 상태
│   └── server/          ← 서버 전용 (DB, auth, socket)
├── hooks.server.ts      ← better-auth 미들웨어
└── app.d.ts             ← 타입 선언
docs/
├── tech_decision/       ← 기술 선택 배경
└── rapid-adaptation/   ← Svelte 5 신속 적응 과정
```
