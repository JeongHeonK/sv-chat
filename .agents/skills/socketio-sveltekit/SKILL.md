---
name: socketio-sveltekit
description: Socket.io + SvelteKit 통합 패턴. SvelteKit의 Vite 개발 서버와 adapter-node 프로덕션 환경에서 Socket.io를 연동하는 이중 구조 구현 시 사용. 트리거: Socket.io 서버 설정, Vite configureServer 훅, 커스텀 프로덕션 서버, WebSocket room 관리, Socket.io 클라이언트 연결.
model: sonnet
context: current
allowed-tools: [Read, Write, Edit, Bash]
---

# Socket.io + SvelteKit 통합 가이드

## 왜 이 스킬이 필요한가

SvelteKit은 자체 HTTP 서버를 관리하기 때문에 Socket.io를 붙이는 표준 방법이 없다.
**개발(Vite)** 과 **프로덕션(adapter-node)** 에서 httpServer 접근 방식이 달라 이중 구조가 필요하다.

이 조합을 다루는 기존 생태계 스킬이 없어 별도로 작성.

---

## 핵심 아키텍처

```
개발:  Vite devServer.httpServer → Socket.io 부착
프로덕션: 커스텀 server.js → build/handler.js + Socket.io 서버 생성
```

---

## 1. 패키지 설치

```bash
pnpm add socket.io socket.io-client
```

---

## 2. 개발 환경: Vite 플러그인 (vite.config.ts)

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { Server } from 'socket.io';
import type { ViteDevServer } from 'vite';

function socketIoPlugin() {
  return {
    name: 'socket-io',
    configureServer(server: ViteDevServer) {
      if (!server.httpServer) return;
      const io = new Server(server.httpServer);
      setupSocketHandlers(io);
    }
  };
}

export default defineConfig({
  plugins: [sveltekit(), socketIoPlugin()],
});
```

**주의**: `configureServer`는 개발 전용. 프로덕션 빌드에는 포함되지 않는다.

---

## 3. 프로덕션 환경: 커스텀 서버 (server.js)

```javascript
// server.js (프로젝트 루트)
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from './build/handler.js'; // adapter-node 출력

const httpServer = createServer(handler);
const io = new Server(httpServer, {
  cors: { origin: process.env.ORIGIN, credentials: true }
});

setupSocketHandlers(io);

httpServer.listen(3000, () => {
  console.log('Server running on :3000');
});
```

**빌드 후 실행**: `node server.js` (not `node build/index.js`)

---

## 4. Socket 핸들러 분리 (src/lib/server/socket/)

```typescript
// src/lib/server/socket/index.ts
import type { Server } from 'socket.io';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('message', (data: { roomId: string; text: string }) => {
      io.to(data.roomId).emit('message', data);
    });

    socket.on('disconnect', () => {
      // cleanup
    });
  });
}
```

---

## 5. 클라이언트 연결 (Svelte 5 Runes)

```typescript
// src/lib/stores/socket.svelte.ts
import { io, type Socket } from 'socket.io-client';

let socket = $state<Socket | null>(null);

export function connectSocket() {
  socket = io({ autoConnect: true });
  return socket;
}

export function getSocket() {
  return socket;
}
```

컴포넌트에서:

```svelte
<script>
  import { connectSocket } from '$lib/stores/socket.svelte';
  import { onMount, onDestroy } from 'svelte';

  let { roomId } = $props();
  let socket = $state(null);

  onMount(() => {
    socket = connectSocket();
    socket.emit('join-room', roomId);
  });

  onDestroy(() => {
    socket?.disconnect();
  });
</script>
```

---

## 6. better-auth 세션과 WebSocket 인증 연결

```typescript
// src/lib/server/socket/index.ts
import { auth } from '$lib/server/auth';

export function setupSocketHandlers(io: Server) {
  // handshake 시 세션 검증
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error('Unauthorized'));

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader })
    });

    if (!session) return next(new Error('Unauthorized'));

    socket.data.user = session.user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    // 인증된 사용자만 이 콜백에 도달
  });
}
```

---

## 주의사항 (Pitfalls)

| 상황 | 문제 | 해결 |
|------|------|------|
| 개발 시 HMR | Socket.io가 중복 연결됨 | `if (socket) socket.disconnect()` 후 재연결 |
| 프로덕션 CORS | 연결 거부 | `ORIGIN` 환경변수 → `cors.origin` 설정 |
| `server.js` 경로 | `build/handler.js` 없음 | `pnpm build` 후 실행 |
| Vite와 포트 충돌 | Socket.io path 충돌 | path 명시: `new Server(httpServer, { path: '/socket.io' })` |
| SSR에서 `io` import | 서버/클라이언트 번들 혼용 | `$lib/server/socket/` 경로에만 두고 클라이언트에서 import 금지 |

---

## 참고

- Socket.io 공식 문서: https://socket.io/docs/v4/server-initialization
- SvelteKit adapter-node: https://kit.svelte.dev/docs/adapter-node
- 프로젝트 기술 결정: `docs/tech_decision/tech_decision.md`
