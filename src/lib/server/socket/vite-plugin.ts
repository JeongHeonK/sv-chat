import type { Plugin, ViteDevServer } from 'vite';
import type { Server as HttpServer } from 'node:http';

export function socketDevPlugin(): Plugin {
	return {
		name: 'socket-io-dev',
		configureServer(server: ViteDevServer) {
			if (!server.httpServer) return;

			server.httpServer.once('listening', () => {
				void initSocket(server);
			});
		}
	};
}

async function initSocket(server: ViteDevServer): Promise<void> {
	try {
		const socketModule = await server.ssrLoadModule('$lib/server/socket/index');
		const authModule = await server.ssrLoadModule('$lib/server/auth');
		const dbModule = await server.ssrLoadModule('$lib/server/db');

		const { setupSocketServer, createSocketDeps } = socketModule as {
			setupSocketServer: (httpServer: HttpServer, deps: unknown) => unknown;
			createSocketDeps: (authApi: unknown, db: unknown) => unknown;
		};

		const auth = (authModule as { auth: { api: unknown } }).auth;
		const db = (dbModule as { db: unknown }).db;

		const deps = createSocketDeps(auth.api, db);
		setupSocketServer(server.httpServer as unknown as HttpServer, deps);

		console.log('[socket.io] Dev server attached');
	} catch (err) {
		console.error('[socket.io] Failed to setup dev server:', err);
	}
}
