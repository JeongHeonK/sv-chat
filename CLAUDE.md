# sv-chat — 1:1 채팅 웹 애플리케이션

> IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning.
> 프로젝트 코드와 docs/ 문서를 먼저 탐색한 후 구현할 것.
> 사전 훈련 데이터보다 프로젝트 내 최신 문서와 코드 패턴 우선.

## 스택

- **Framework**: SvelteKit 5 (Svelte 5 Runes 문법)
- **Realtime**: Socket.io
- **DB**: PostgreSQL + Drizzle ORM
- **Auth**: better-auth (세션 기반, email/password)
- **CSS**: Tailwind CSS 4 + shadcn-svelte
- **Test**: Vitest (client: browser-playwright, server: node)
- **Adapter**: @sveltejs/adapter-node
- **Deploy**: Railway

## 프로젝트 구조

```
src/
├── routes/              ← 페이지 + API
├── routes/api/          ← REST API
├── lib/server/          ← 서버 전용 (DB, auth)
├── lib/server/db/       ← Drizzle 스키마
├── hooks.server.ts      ← better-auth 핸들러
└── app.d.ts             ← App.Locals 타입
```

## 명령어

- `pnpm validate` — type check + lint 통합 검사 (코드 변경 후 반드시 실행)
- `pnpm test` — 전체 테스트
- `pnpm format` — prettier 포맷

## 컨벤션

- Svelte 5 Runes 문법 사용 (`$state`, `$derived`, `$effect`, `$props`)
- TypeScript strict mode
- 패키지 매니저: pnpm
- DB 스키마: `src/lib/server/db/schema.ts` (Drizzle)
- 환경변수: `.env` (DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET)
- 테스트 파일: `*.spec.ts` (서버), `*.svelte.spec.ts` (클라이언트)
- Vitest `requireAssertions: true` — 모든 테스트에 assertion 필수

## Architecture Principles

### SvelteKit 구조

- SvelteKit 파일 기반 라우팅 컨벤션을 따름
- `src/lib/server/`는 서버 전용 코드 — 클라이언트에서 import 금지
- `$lib` alias 사용, 상대 경로 import 지양

### TypeScript Strict

- `any` 사용 금지 → `unknown` + type guard 활용
- type assertion (`as`) 최소화 → 타입 추론과 narrowing 우선
- Discriminated union으로 상태 모델링

## 문서 인덱스 (Documentation Index)

프로젝트 컨텍스트 파악 시 아래 문서를 우선 참조:

| 목적      | 경로                                        | 요약                                |
| --------- | ------------------------------------------- | ----------------------------------- |
| 요구사항  | `docs/prd/prd.md`                           | 기능 명세, 마일스톤, UI/UX          |
| 기술 선택 | `docs/tech_decision/tech_decision.md`       | 왜 Socket.io? Drizzle? better-auth? |
| 학습 과정 | `docs/rapid-adaptation/rapid-adaptation.md` | 실제 문제 해결 사례                 |
| 구현 작업 | `docs/task/*.md`                            | 순차적 작업 체크리스트 (14개)       |

## 기술별 참조 맵

프로젝트 코드를 먼저 탐색한 후, 필요 시 아래 skills 참조:

| 영역                 | Skill                        | 핵심 내용                                  |
| -------------------- | ---------------------------- | ------------------------------------------ |
| Svelte 5 + SvelteKit | `svelte5`                    | runes.md, sveltekit.md, ssr-hydration.md   |
| Socket.io 통합       | `socketio-sveltekit`         | dev/prod 이중 구조, better-auth 연동       |
| DB 스키마/쿼리       | `drizzle-orm`                | PostgreSQL 전용, type inference, N+1 방지  |
| 인증                 | `better-auth-best-practices` | 세션 설정, 플러그인, Drizzle 어댑터        |
| UI 컴포넌트          | shadcn-svelte (context7)     | `npx shadcn-svelte@latest add <component>` |

<!-- Agent Context 최적화 근거 (https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- 수평적(범용) 지식 → CLAUDE.md 파일 인덱스로 패시브 제공 (skill 자동 트리거 56% 실패)
- 수직적(특정 액션) 워크플로우만 skill로 유지
- 40KB → 8KB 인덱스 압축으로 동일 성능 달성
- "Explore project first, then consult docs" 패턴 적용 -->

## Workflow

### 자율 구현 사이클

계획 기반 구현 시 아래 순서를 중단 없이 완주할 것:

1. 코드베이스 구조 + CLAUDE.md 읽기
2. 변경 대상 파일을 포괄하는 상세 구현 계획 작성
3. 모든 파일에 걸쳐 변경 구현
4. 각 주요 변경 후 테스트 실행 → 실패 수정 → 통과할 때까지 반복
5. 린터 실행 및 이슈 수정
6. `/git-commit`으로 커밋 (직접 git commit 금지)
7. README/버전 업데이트 (필요 시)
8. PR 필요 시 `/git-create-pr`로 생성 (직접 gh pr create 금지)

**원칙**: 확인 요청 없이 전체 사이클 자율 완료. 멈추지 말 것.

### 병렬 리팩토링 사이클

코드베이스 전체 리팩토링 시 서브 에이전트를 활용한 병렬 처리:

1. 모든 관련 소스 파일을 읽고 의존성 그래프 매핑
2. 리팩토링을 모듈/디렉토리별 독립적 하위 작업으로 분해
3. Task로 각 그룹에 병렬 서브 에이전트 생성 — 각자 변경 + 독립 검증
4. 모든 서브 에이전트 완료 후 전체 일관성 검토
5. 테스트 실행 → 통합 이슈 수정
6. 린터 실행 → 경고 수정
7. `/git-commit`으로 커밋 (직접 git commit 금지)

**충돌 처리**: 서브 에이전트 간 충돌은 의존성 인식 순서(blockedBy)를 우선하여 해결.

### 마일스톤 체크포인트

미완성 세션 방지를 위한 체크포인트 기반 진행:

1. 작업을 번호 매긴 마일스톤으로 분할
2. 각 마일스톤 완료 후 테스트 실행, `/git-commit`으로 커밋
3. 오류/모호함 발생 시 멈추지 말 것 — 최선의 판단 후 코드 주석에 가정 문서화하고 계속 진행
4. 모든 마일스톤 후 전체 테스트 + 린터 실행, 실패 수정
5. `/git-commit`으로 최종 커밋
6. 완료 검증: 모든 파일 저장, 테스트 통과, 린터 클린, README 업데이트

**원칙**: 절대 미완성 상태로 세션을 끝내지 말 것 — 항상 `/git-commit`으로 진행 상황을 커밋할 것.

### Git Workflow

- Always use skill-based git commands (`/git-commit`, `/git-create-pr`, `/git-branch`) when available instead of raw git commands.
- Always create a branch before starting work unless explicitly told otherwise.
- When committing, never include `Co-authored-by` lines unless explicitly requested.

## Conventions

- **Commit**: `<type>(<scope>): <설명>`
- **TypeScript 우선**: 새 파일은 항상 TypeScript 사용, strict 타이핑 선호
- **세션 내 완료**: 버전 범프와 README 업데이트는 같은 세션에서 반드시 완료 — 후속 작업으로 남기지 말 것
- **체크포인트 실행**: 다중 파일 구현 시 명시적 체크포인트로 분할, 각 단계 완료 확인 후 다음 진행
- **점진적 커밋**: 각 논리적 단위 완료 후 `/git-commit`으로 즉시 커밋. 핵심 변경이 모두 커밋될 때까지 버전/README 업데이트로 넘어가지 말 것

## Task Execution

- Start implementation quickly — minimize upfront planning unless the user explicitly asks for a plan.
- When user gives multiple tasks, confirm scope briefly then execute; don't over-plan.
- If a task has been planned in a previous session, jump straight to implementation.

## Editing Principles

- When asked to tone down or soften content, do NOT delete metrics or claims that the user measured/verified — rephrase them more conservatively instead.
- Never remove content without asking first; prefer modifying over deleting.
- When updating docs/resume/portfolio, verify which metrics are real (user-measured) vs. estimated before changing them.

## Verification Before Completion

- Before declaring a task done, verify: build passes, lint passes, tests pass, and images/assets are included.
- After updating any profile/README content, verify it's updated in ALL locations (repo README, GitHub profile README, resume, portfolio).
- Check that demo apps actually demonstrate the intended behavior, not just a reset/placeholder.

## Context Management

세션 간 컨텍스트 연속성을 위한 Node.js 기반 hook 시스템 (`scripts/hooks/`).

| Hook                   | 트리거       | 동작                                                                                    |
| ---------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `session-start.cjs`    | SessionStart | git 상태 + 최근 스냅샷/학습 내용을 stdout으로 출력 → Claude 컨텍스트 주입               |
| `pre-compact.cjs`      | PreCompact   | git diff/log + transcript tool 사용 파일 → `.claude/context/state_*.md` (최근 3개 유지) |
| `session-complete.cjs` | Stop         | 커밋 목록 + 수정 파일 + 미커밋 변경 → `.claude/learnings/session_*.md` (최근 5개 유지)  |

```
scripts/hooks/
├── lib/utils.cjs          # 공유 유틸리티 (git, transcript 파싱, 파일 관리)
├── session-start.cjs      # SessionStart → stdout 출력
├── pre-compact.cjs        # PreCompact → 스냅샷 저장
└── session-complete.cjs   # Stop → 학습 내용 저장
```
