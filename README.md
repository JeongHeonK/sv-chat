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
```
