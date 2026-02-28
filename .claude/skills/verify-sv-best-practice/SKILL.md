---
name: verify-sv-best-practice
description: >
  Svelte 5 + SvelteKit best practice 위반 탐지. Svelte 5 Runes anti-pattern,
  SvelteKit 타입 안전성, SSR 안전성을 Grep 기반으로 검증한다.
  코드 리뷰, PR 전, Svelte 파일 변경 후 사용. Triggers on: *.svelte, +page.server.ts,
  hooks.server.ts, *.svelte.ts 파일 변경.
context: current
model: haiku
allowed-tools:
  - Grep
  - Glob
  - Read
---

# Verify Svelte 5 + SvelteKit Best Practices

svelte5 skill의 패턴을 기반으로 프로젝트 코드의 anti-pattern을 탐지한다.
각 규칙을 순서대로 실행하고 PASS / WARN / FAIL 결과를 집계한다.

## Related Files

- `src/**/*.svelte`
- `src/**/+page.server.ts`
- `src/**/+layout.server.ts`
- `src/**/*.svelte.ts`
- `src/hooks.server.ts`

## Exceptions

아래 파일은 모든 규칙에서 제외:
- `src/**/__tests__/**`
- `src/**/*.spec.ts`

---

## Workflow

### RUNES-01: on:event 디렉티브 (Svelte 4 구문)

Svelte 5에서 `on:click` 등은 deprecated. `onclick` 콜백 props 사용.

```
Grep:
  pattern: on:(click|change|input|submit|keydown|keyup|focus|blur|mouseover|mouseout)
  glob: src/**/*.svelte
```

- **PASS**: 매칭 없음
- **FAIL**: 해당 파일:라인 목록 출력 → `onclick` 속성으로 변경 필요

```svelte
<!-- FAIL -->  <button on:click={handler}>
<!-- FIX  -->  <button onclick={handler}>
```

---

### RUNES-02: createEventDispatcher 사용

Svelte 5에서는 callback props 사용. `createEventDispatcher`는 제거됨.

```
Grep:
  pattern: createEventDispatcher
  glob: src/**/*.svelte
```

- **PASS**: 매칭 없음
- **FAIL**: callback props 패턴으로 변환 필요

```svelte
<!-- FAIL -->
const dispatch = createEventDispatcher();
dispatch('change', value);

<!-- FIX -->
let { onchange } = $props();
onchange?.(value);
```

---

### RUNES-03: `<slot>` 사용 (Svelte 4 구문)

Svelte 5에서는 `{@render children()}` snippet 패턴 사용.

```
Grep:
  pattern: <slot
  glob: src/**/*.svelte
```

- **PASS**: 매칭 없음
- **FAIL**: `{#snippet}` / `{@render}` 패턴으로 변환 필요

---

### RUNES-04: `export let` (Svelte 4 props 패턴)

Svelte 5에서는 `$props()` rune 사용. `export let`은 동작하지 않음.

```
Grep:
  pattern: export let
  glob: src/**/*.svelte
```

- **PASS**: 매칭 없음
- **FAIL**: `$props()` 로 변환 필요

```svelte
<!-- FAIL -->  export let value = '';
<!-- FIX  -->  let { value = '' } = $props();
```

---

### KIT-01: Form Action에서 throw error() → 유효성 검사 오류 페이지 노출

유효성 검사 실패에 `throw error(4xx)`를 쓰면 오류 페이지가 표시됨.
`return fail(4xx, {...})`을 사용해야 폼 상태가 보존됨.

```
Grep:
  pattern: throw error\(4
  glob: src/**/+page.server.ts
```

- **PASS**: 매칭 없음
- **FAIL**: `return fail(400, { errors, ... })` 으로 교체 필요

---

### KIT-02: Actions 타입을 @sveltejs/kit에서 import (타입 안전성 저하)

`./$types`의 `Actions`는 params/return 타입이 자동 추론됨.
`@sveltejs/kit`의 `Actions`는 제네릭 타입으로 덜 구체적.

```
Grep:
  pattern: import type \{ Actions \} from '@sveltejs/kit'
  glob: src/**/+page.server.ts
```

- **PASS**: 매칭 없음
- **WARN**: `./$types`에서 import 권장

```ts
// WARN  import type { Actions } from '@sveltejs/kit';
// BETTER import type { Actions } from './$types';
```

---

### KIT-03: 페이지 컴포넌트 $props() 타입 주석 누락

`PageProps` / `LayoutProps` 타입 없이 `$props()`를 사용하면 form/data 타입 추론 불가.

**Step 1** — `= $props()` 패턴 파일 수집:
```
Grep:
  pattern: = \$props\(\)
  glob: src/**/*.svelte
  output_mode: files_with_matches
```

**Step 2** — 각 파일에 `PageProps` 또는 `LayoutProps` import 있는지 확인:
```
Grep:
  pattern: PageProps|LayoutProps
  glob: src/**/*.svelte
  output_mode: files_with_matches
```

Step 1 결과에 있지만 Step 2 결과에 없는 파일:
- `+page.svelte` → `PageProps` 누락 → **WARN**
- `+layout.svelte` → `LayoutProps` 누락 → **WARN**
- 그 외 (일반 컴포넌트) → 의도적일 수 있음 → SKIP

```svelte
<!-- WARN (타입 주석 없음) -->
let { data, form } = $props();

<!-- FIX -->
import type { PageProps } from './$types';
let { data, form }: PageProps = $props();
```

---

### SSR-01: 서버 파일 모듈 레벨 가변 상태 (SSR 데이터 유출)

서버 파일의 module-level `let`은 모든 요청 간 공유 → 사용자 데이터 유출 위험.

```
Grep:
  pattern: ^let \w+
  glob: src/**/*.server.ts
  output_mode: content
```

매칭 라인 수동 검토:
- 함수/핸들러 **밖**에 있는 가변 상태 → **FAIL** (사용자 데이터 유출 가능)
- `const` 선언, 함수 내부 `let` → **PASS** (grep 패턴 한계, 문맥 확인 필요)

```ts
// FAIL — 모듈 레벨 가변 상태
let currentUser = null; // 모든 요청 간 공유!

// OK — 함수 내부
export const load = async ({ locals }) => {
  let user = locals.user; // 요청마다 새로운 스코프
};
```

---

### SSR-02: browser 체크 없이 window/localStorage 접근

서버에서 `window` 등에 접근하면 SSR 빌드 실패.
`browser` import 또는 `onMount` 내부에서만 접근해야 함.

```
Grep:
  pattern: (window\.|localStorage\.|document\.getElementById)
  glob: src/**/*.{ts,svelte}
  output_mode: content
```

매칭 라인 문맥 확인:
- `if (browser)` 블록 내부, `onMount` 콜백 내부 → **PASS**
- 그 외 → **FAIL**

```ts
// FAIL
const width = window.innerWidth;

// FIX
import { browser } from '$app/environment';
const width = browser ? window.innerWidth : 1024;
```

---

## Result Template

모든 규칙 실행 후 아래 형식으로 출력:

```
| 규칙     | 결과 | 파일                            | 비고                     |
|----------|------|---------------------------------|--------------------------|
| RUNES-01 | PASS | -                               | -                        |
| RUNES-02 | PASS | -                               | -                        |
| RUNES-03 | PASS | -                               | -                        |
| RUNES-04 | PASS | -                               | -                        |
| KIT-01   | PASS | -                               | -                        |
| KIT-02   | WARN | (auth)/login/+page.server.ts    | ./$types import 권장     |
| KIT-03   | WARN | (auth)/login/+page.svelte       | PageProps 타입 주석 누락 |
| SSR-01   | PASS | -                               | -                        |
| SSR-02   | PASS | -                               | -                        |
```

## Success Criteria

- **FAIL 없음** → ✅ Svelte 5 best practice 준수
- **WARN만 있음** → ⚠️ 타입 안전성 개선 권장 (필수 아님)
- **FAIL 있음** → ❌ 수정 필요 — svelte5 skill의 패턴 참조

## References

- `svelte5` skill — Runes gotchas, SvelteKit patterns, SSR 안전성 상세
