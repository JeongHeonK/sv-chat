# Task 20: 버그 및 UX 개선 4건

> Phase 5 UI 구현 후 실제 사용에서 발견된 버그/개선점

## 체크리스트

- [ ] Bug 1: 로그인 비밀번호 Enter 키 submit
- [ ] Bug 2: 안읽음 뱃지 채팅방 진입 시 리셋
- [ ] Fix 3: 스크롤 중 메시지 입력 단축키 (Escape)
- [ ] Fix 4: 메시지 전송 후 최하단 자동 스크롤

---

## Bug 1: 로그인 비밀번호 Enter 키 미작동

**증상**: 비밀번호 입력 후 Enter 눌러도 폼이 제출되지 않음.

**원인**: shadcn-svelte `Button` 기본값이 `type = 'button'` (button.svelte:51). 로그인 페이지에서 `type="submit"` 전달하고 있으나 런타임 확인 필요. 만약 동작하지 않으면 명시적 Enter 핸들러 추가.

**수정 파일**: `src/routes/(auth)/login/+page.svelte`

**방법**: 런타임 확인 후 필요 시 — form에 `use:enhance` 도입 또는 password Input에 Enter keydown 핸들러 추가.

---

## Bug 2: 안읽음 뱃지 새로고침 안됨

**증상**: 채팅방에 들어가도 사이드바 안읽음 카운트가 유지됨.

**원인 2가지**:
1. `updateLastReadAt()` 함수가 `src/lib/server/rooms/unread.ts:27`에 구현되었으나 **앱에서 호출하지 않음**
2. `+layout.server.ts`의 `unreadCounts`가 자식 페이지 이동 시 자동 재실행되지 않음

**수정 파일**:
- `src/routes/(app)/chat/[roomId]/+page.server.ts` — `updateLastReadAt()` 호출 추가
- `src/routes/(app)/+layout.server.ts` — `event.depends('app:rooms')` 추가
- `src/routes/(app)/chat/[roomId]/+page.svelte` — `invalidate('app:rooms')` 호출

**핵심 변경**:
```typescript
// [roomId]/+page.server.ts load()
await updateLastReadAt(db, userId, roomId);

// +layout.server.ts load()
event.depends('app:rooms');

// [roomId]/+page.svelte
import { invalidate } from '$app/navigation';
// $effect로 roomId 변경 시 invalidate('app:rooms') 호출
```

**재사용**: `updateLastReadAt()` — `src/lib/server/rooms/unread.ts`

---

## Fix 3: 스크롤 중 메시지 입력 단축키

**증상**: 스크롤 올린 상태에서 입력칸으로 돌아가려면 마우스 클릭만 가능.

**수정 파일**:
- `src/lib/components/message-input.svelte` — `ref` 바인딩 + focus 함수 export
- `src/routes/(app)/chat/[roomId]/+page.svelte` — `svelte:window` keydown 리스너

**단축키**: `Escape` → 입력칸 포커스 + 하단 스크롤
**안내**: 스크롤 시 "↓ Esc로 최신 메시지로 이동" 플로팅 표시

**핵심 변경**:
```svelte
<!-- message-input.svelte -->
let inputRef: HTMLInputElement | null = $state(null);
// Input에 bind:ref={inputRef}
export function focus() { inputRef?.focus(); }

<!-- [roomId]/+page.svelte -->
<svelte:window onkeydown={handleKeydown} />
// Escape 키: focus() + scrollToBottom()
```

---

## Fix 4: 메시지 전송 후 최하단 스크롤

**증상**: 위로 스크롤한 상태에서 메시지 전송 시 화면이 아래로 이동하지 않음.

**원인**: `auto-scroll.ts`의 MutationObserver가 `isAtBottom === true`일 때만 스크롤. 위로 스크롤하면 `isAtBottom = false`가 되어 전송 후에도 스크롤 발동 안됨.

**수정 파일**:
- `src/lib/chat/auto-scroll.ts` — `scrollToBottom()` 외부 호출 가능하도록 return
- `src/lib/components/message-input.svelte` — `onSend` 콜백 prop 추가
- `src/routes/(app)/chat/[roomId]/+page.svelte` — 전송 성공 후 강제 스크롤

**핵심 변경**:
```typescript
// auto-scroll.ts return 객체 확장
return {
  destroy() { ... },
  scrollToBottom() { node.scrollTop = node.scrollHeight; isAtBottom = true; }
}

// message-input.svelte
let { onSend, ... } = $props();
// enhance 성공 콜백에서 onSend?.() 호출

// [roomId]/+page.svelte
// onSend={() => scrollRef.scrollToBottom()} 전달
```

---

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `src/routes/(auth)/login/+page.svelte` | Enter 키 submit 검증/수정 |
| `src/routes/(app)/chat/[roomId]/+page.server.ts` | `updateLastReadAt()` 호출 |
| `src/routes/(app)/+layout.server.ts` | `depends('app:rooms')` |
| `src/routes/(app)/chat/[roomId]/+page.svelte` | invalidate + 키보드 단축키 + 스크롤 제어 |
| `src/lib/components/message-input.svelte` | ref export + onSend 콜백 |
| `src/lib/chat/auto-scroll.ts` | scrollToBottom 외부 호출 |

## 검증

1. `pnpm test` — 기존 테스트 전체 통과
2. `pnpm validate` — TypeScript + ESLint 클린
3. 수동 확인:
   - 로그인: 비밀번호 Enter → 로그인 완료
   - 안읽음 뱃지: 채팅방 진입 → 0으로 리셋
   - Escape: 스크롤 중 → 입력칸 포커스 + 하단 이동
   - 전송: 스크롤 올린 상태 전송 → 하단 자동 이동
