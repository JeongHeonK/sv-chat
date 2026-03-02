# Task 20: 버그 및 UX 개선 7건

> Phase 5 UI 구현 후 실제 사용에서 발견된 버그/개선점

## 체크리스트

- [ ] Bug 1: 로그인 비밀번호 Enter 키 submit
- [ ] Bug 2: 안읽음 뱃지 채팅방 진입 시 리셋
- [ ] Fix 3: 스크롤 중 메시지 입력 단축키 (Escape)
- [ ] Fix 4: 메시지 전송 후 최하단 자동 스크롤
- [ ] Feat 5: 채팅방 나가기 (목록에서 제거)
- [ ] Feat 6: 채팅방 삭제
- [ ] Feat 7: 비어있는 화면 대응 (Empty State UI)

---

## Bug 1: 로그인 비밀번호 Enter 키 미작동

**증상**: 비밀번호 입력 후 Enter 눌러도 폼이 제출되지 않음.

**원인**: shadcn-svelte `Button` 기본값이 `type = 'button'` (button.svelte:51). 로그인 페이지에서 `type="submit"` 전달하고 있으나 런타임 확인 필요. 만약 동작하지 않으면 명시적 Enter 핸들러 추가.

**수정 파일**: `src/routes/(auth)/login/+page.svelte`

**방법**: 런타임 확인 후 필요 시 — form에 `use:enhance` 도입 또는 password Input에 Enter keydown 핸들러 추가. (※ 회원가입 폼 등 다른 화면의 폼에서도 동일하게 Enter가 동작하지 않는지 함께 점검)

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
**모바일 대응**: 컴팩트한 화면 및 터치 기반 환경을 위해 스크롤을 올렸을 때 우측 하단에 "⬇︎ 최근 메시지 보기" 플로팅 버튼 아이콘 추가 (클릭 시 포커스 + 하단 이동)

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

**UX 고려사항**: 내가 스크롤을 올려둔 상태(`isAtBottom = false`)에서 '상대방의 새 메시지'가 수신되었을 경우 스크롤을 바닥으로 강제 이동하지 않고 유지. 대신 "⬇︎ 최근 메시지 보기" 플로팅 버튼에 새 메시지 N건을 알리는 빨간색 뱃지 노출.

---

## Feat 5: 채팅방 나가기 (목록에서 제거)

**증상**: 채팅방을 더 이상 보고 싶지 않은데 목록에서 숨기거나 나갈 방법이 없음.

**설계**: 1:1 채팅이므로 "나가기" = `roomUser` 레코드 삭제. 양쪽 모두 나가면 room 자체 삭제.
**UX 고려사항**: 상대방이 방을 나간 경우, 남은 사용자의 화면에 "(알 수 없음)님이 채팅방을 나갔습니다." 형태의 시스템 메시지 노출 및 메시지 입력란 `disabled` 처리하여 추가 전송 방지.

**수정 파일**:
- `src/lib/server/rooms/leave-room.ts` — 새 파일: `leaveRoom(db, userId, roomId)` 함수
- `src/routes/api/rooms/[roomId]/+server.ts` — 새 파일: `DELETE /api/rooms/[roomId]` 엔드포인트
- `src/lib/components/room-item.svelte` — 나가기 버튼 UI 추가 (스와이프 또는 컨텍스트 메뉴)
- `src/routes/(app)/+layout.svelte` — 나간 후 목록 갱신 (`invalidate('app:rooms')`)

**핵심 변경**:
```typescript
// leave-room.ts
export async function leaveRoom(db: Database, userId: string, roomId: string) {
  await db.delete(roomUser)
    .where(and(eq(roomUser.roomId, roomId), eq(roomUser.userId, userId)));

  // 남은 멤버가 0명이면 room 자체 삭제 (cascade로 messages도 정리)
  const remaining = await db.select({ id: roomUser.id })
    .from(roomUser).where(eq(roomUser.roomId, roomId)).limit(1);
  if (remaining.length === 0) {
    await db.delete(room).where(eq(room.id, roomId));
  }
}

// DELETE /api/rooms/[roomId]
// assertRoomMember() → leaveRoom() → json({ success: true })
```

---

## Feat 6: 채팅방 삭제

**증상**: 채팅방 자체를 완전히 삭제하고 싶은 경우 (양쪽 모두 삭제).

**설계**: room 삭제 시 cascade로 `roomUser` + `message` 자동 정리. 삭제 권한은 방 멤버만 가능. 상대방에게 Socket 이벤트로 알림.

**수정 파일**:
- `src/routes/api/rooms/[roomId]/+server.ts` — Feat 5와 동일 파일, 쿼리 파라미터 또는 별도 엔드포인트로 분리
- `src/lib/server/rooms/delete-room.ts` — 새 파일: `deleteRoom(db, roomId)` 함수
- `src/lib/components/room-item.svelte` — 삭제 버튼 + 확인 다이얼로그
- `src/lib/server/socket/index.ts` — `room:deleted` 이벤트 브로드캐스트

**핵심 변경**:
```typescript
// delete-room.ts
export async function deleteRoom(db: Database, roomId: string) {
  // cascade 설정으로 roomUser, message 자동 삭제
  await db.delete(room).where(eq(room.id, roomId));
}

// Socket: 상대방에게 room:deleted 이벤트 전송
// 클라이언트: 해당 room이 목록에서 즉시 제거 + 현재 열린 방이면 메인으로 리다이렉트
```

**UX**: 삭제 전 확인 다이얼로그 필수 ("이 채팅방을 삭제하시겠습니까? 모든 메시지가 삭제됩니다.")

---

## Feat 7: 비어있는 화면 대응 (Empty State UI)

**설계**:
- **사이드바**: 나의 채팅 목록이 하나도 없을 때 빈 화면 대신 *"아직 대화가 없습니다."* 등 안내 문구 노출
- **채팅방**: 방에 처음 진입했으나 아직 메시지를 1건도 주고받지 않은 상태일 때 중앙에 *"건강한 대화를 나눠보세요"* 등 텍스트나 플레이스홀더 노출

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
| `src/lib/server/rooms/leave-room.ts` | **새 파일**: leaveRoom() 함수 |
| `src/lib/server/rooms/delete-room.ts` | **새 파일**: deleteRoom() 함수 |
| `src/routes/api/rooms/[roomId]/+server.ts` | **새 파일**: DELETE 엔드포인트 |
| `src/lib/components/room-item.svelte` | 나가기/삭제 버튼 UI |
| `src/lib/server/socket/index.ts` | `room:deleted` 이벤트 추가 |

## 검증

1. `pnpm test` — 기존 테스트 전체 통과
2. `pnpm validate` — TypeScript + ESLint 클린
3. 수동 확인:
   - 로그인: 비밀번호 Enter → 로그인 완료
   - 안읽음 뱃지: 채팅방 진입 → 0으로 리셋
   - Escape: 스크롤 중 → 입력칸 포커스 + 하단 이동
   - 전송: 스크롤 올린 상태 전송 → 하단 자동 이동
   - 나가기: room-item 나가기 → 목록에서 제거 확인
   - 삭제: 확인 다이얼로그 → 양쪽 모두 삭제 + 상대방 실시간 반영
   - Empty State: 빈 목록/빈 채팅방 안내 문구 표시
