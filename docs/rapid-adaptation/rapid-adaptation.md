# Rapid Adaptation — Svelte 5 신속 적응 과정

> Alicon 채팅 과제 (기한: 2026-03-02) 수행 중 Svelte 5를 처음 접하며 빠르게 습득한 과정을 기록

---

## 1. 학습 전략

### 1.1 공식 문서 선제 파악

기존 학습 방식("일단 만들면서 배우기")을 버리고, Svelte 5 Runes의 **동작 원리**를 먼저 파악했다.

- `$state` → Proxy 기반 세밀한 반응성 (배열/객체 내부 변경도 추적)
- `$derived` → 의존성 자동 추론 (useMemo와 달리 배열 명시 불필요)
- `$effect` → DOM 사이드이펙트 (cleanup 함수 반환으로 구독 해제)
- `$props` → 구조분해 할당으로 타입 안전한 props 선언

### 1.2 기존 멘탈 모델 매핑

| 기존 경험           | Svelte 5 대응       | 차이점                        |
| ------------------- | ------------------- | ----------------------------- |
| React `useState`    | `$state`            | 별도 setter 없음, 직접 할당   |
| React `useMemo`     | `$derived`          | 의존성 배열 자동 추론         |
| React `useEffect`   | `$effect`           | 반응형 값 변경 시 자동 재실행 |
| Vue `defineProps`   | `$props()` 구조분해 | TypeScript 타입 인라인 선언   |
| Svelte 4 `writable` | `$state` (Class)    | 도메인 로직을 Class로 캡슐화  |

### 1.3 도메인 로직 분리 전략

UI와 비즈니스 로직을 분리하기 위해 **Class-based State** 패턴을 채택했다.

```typescript
// 기존 store 기반 접근 (Svelte 4)
export const messages = writable<Message[]>([]);

// Class-based State (Svelte 5)
class ChatStore {
	messages = $state<Message[]>([]);
	isLoading = $state(false);

	addMessage(msg: Message) {
		this.messages.push(msg);
	}
}
export const chatStore = new ChatStore();
```

UI 컴포넌트는 상태를 직접 관리하지 않고 store 메서드를 호출하는 형태로 관심사를 분리했다.

---

## 2. 습득한 기술

### 2.1 Svelte 5 Runes 세밀한 상태 제어

- `$state.snapshot()` — 반응형 상태의 불변 스냅샷 (이벤트 핸들러 내 참조용)
- `$derived.by()` — 복잡한 계산 로직을 함수 블록으로 처리
- `$effect.pre()` — DOM 업데이트 전 실행이 필요한 사이드이펙트

### 2.2 SvelteKit 5 SSR + API 라우팅

- `+page.server.ts`의 `load()` 함수로 서버사이드 데이터 페칭
- API 엔드포인트(`+server.ts`)와 페이지 로더의 역할 분리
- `event.locals`를 통한 세션 데이터 전파 (hooks.server.ts → page)

### 2.3 Svelte 5 환경 통합 아키텍처

- better-auth + SvelteKit 세션 미들웨어 연결
- Socket.io + Vite 개발 서버 / adapter-node 프로덕션 이중 구조
- Drizzle ORM TypeScript 스키마 → DB 직접 제어

---

## 3. 문제 해결 과정

### 3.1 Socket.io + SvelteKit 통합

**문제**: SvelteKit은 HTTP 서버를 내부적으로 관리하여 Socket.io를 표준 방식으로 부착할 수 없다.

**탐색 과정**:

1. SvelteKit 공식 문서에 WebSocket 가이드 없음 확인
2. community 사례 검색 → Vite `configureServer` 훅 활용 패턴 발견
3. 프로덕션과 개발 환경의 httpServer 접근 방식이 다름을 파악

**해결**:

```
개발: vite.config.ts의 configureServer 훅 → httpServer에 Socket.io 부착
프로덕션: 커스텀 server.js → build/handler.js import + Socket.io 서버 생성
```

상세 패턴은 [socketio-sveltekit 스킬](./../.agents/skills/socketio-sveltekit/SKILL.md) 참고.

### 3.2 better-auth 세션 + WebSocket 인증 연결

**문제**: HTTP 세션(쿠키 기반)과 WebSocket 연결의 인증 컨텍스트가 분리되어 있다.

**탐색 과정**:

1. better-auth `auth.api.getSession()` API 확인
2. Socket.io `io.use()` 미들웨어에서 handshake headers 접근 가능 확인
3. 쿠키 헤더를 직접 `getSession()`에 전달하는 방식 도출

**해결**:

```typescript
io.use(async (socket, next) => {
	const session = await auth.api.getSession({
		headers: new Headers({ cookie: socket.handshake.headers.cookie ?? '' })
	});
	if (!session) return next(new Error('Unauthorized'));
	socket.data.user = session.user;
	next();
});
```

### 3.3 Svelte 5 Runes와 Class 조합의 반응성 이슈

**문제**: Class 메서드 내에서 `$state` 필드를 업데이트했을 때 UI가 갱신되지 않는 케이스 발생.

**원인**: Class 인스턴스를 `$state`로 감싸지 않으면 Svelte가 내부 변경을 추적하지 못한다.

**해결**: Class 정의 시 `$state` 필드를 직접 선언하고, 인스턴스를 모듈 스코프 변수로 export.

```typescript
// ❌ 반응성 누락
export const store = $state(new ChatStore()); // ChatStore 내부 변경 미추적

// ✅ 올바른 방식
class ChatStore {
	messages = $state<Message[]>([]); // 필드 레벨에서 $state 선언
}
export const store = new ChatStore();
```

---

## 4. 기술적 의사결정 요약

자세한 기술 선택 배경은 [Tech Decision](./tech_decision/tech_decision.md) 참고.

**학습 관점 핵심 결정**:

| 결정           | 이유 (학습 측면)                                        |
| -------------- | ------------------------------------------------------- |
| BaaS 미사용    | 실시간 통신 원리를 직접 구현하여 이해도 증명            |
| SvelteKit 단독 | 프레임워크 구조(라우팅, SSR, API) 를 깊이 파악          |
| Drizzle ORM    | TypeScript 스키마로 DB 구조를 코드로 표현하는 방식 습득 |
| better-auth    | 세션 기반 인증 흐름을 직접 제어하며 보안 원리 이해      |

---

## 5. 메타 학습 프레임워크

이번 과제를 통해 **새 기술 신속 적응**을 위한 개인 프레임워크를 정립했다:

```
1. 원리 파악 (Why/How) → 공식 문서 30분 집중
2. 기존 경험 매핑 → "이건 React의 X와 같다" 연결고리 구성
3. 가장 낯선 부분 먼저 → HMR, Proxy 반응성 등 불확실한 영역 우선 실험
4. 스킬로 문서화 → 재사용 가능한 패턴으로 추출
5. 통합 검증 → 독립적으로 학습한 요소들을 조합하여 전체 흐름 확인
```

> "도구에 종속되지 않고, 필요한 도구를 빠르게 익혀 최적의 아키텍처를 설계하는 개발자"

---

## 6. Agent Context 최적화

스킬로 문서화한 지식을 AI 에이전트가 효율적으로 활용하도록 컨텍스트 구조를 최적화했다.

### 6.1 배경

[Vercel 블로그](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) 분석 결과, 스킬 자동 트리거 실패율이 56%로 높아 **수동적 컨텍스트(CLAUDE.md 파일 인덱스)**가 더 신뢰할 수 있었다. 설치한 7개 스킬(7,399줄) 중 상당수가 Claude의 사전 훈련 지식과 중복되거나, 프로젝트 스택과 불일치(React 기반 shadcn-ui 등)하는 문제가 있었다.

### 6.2 최적화 내용

| 항목              | Before             | After                        |
| ----------------- | ------------------ | ---------------------------- |
| 스킬 수           | 7개                | 4개                          |
| 스킬 총 라인      | 7,399줄            | 2,007줄 (-73%)               |
| CLAUDE.md         | 인덱스 없음        | 문서 인덱스 + 기술별 참조 맵 |
| 프레임워크 불일치 | 1개 (React shadcn) | 0                            |

**경량화 원칙:**

- **유지**: Claude 사전 훈련에 없는 Svelte 5 전용 gotcha/패턴 (`$state.raw`, `$derived.by`, `svelte:boundary` bug #17717 등)
- **제거**: 기본 문법, 표준 SvelteKit 컨벤션, 프로젝트에 해당하지 않는 DB/런타임 예시

**패시브 인덱싱:**

CLAUDE.md에 문서 인덱스와 기술별 참조 맵을 추가하여, 에이전트가 프로젝트 코드를 먼저 탐색한 후 필요 시 관련 스킬을 참조하는 "retrieval-led reasoning" 패턴을 적용했다.

### 6.3 관련 링크

- [CLAUDE.md](../../CLAUDE.md) — 문서 인덱스 + 기술별 참조 맵
- [Vercel: agents-md outperforms skills](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) — 근거 블로그
