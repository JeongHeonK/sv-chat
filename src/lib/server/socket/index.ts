import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createAuthMiddleware } from './auth';
import {
	createSyncHandler,
	createMessageQuery,
	createMembershipCheck,
	type QueryMessagesFn,
	type CheckMembershipFn
} from './sync';
import { createJoinHandler } from './join';
import { setIO } from './io';
import type { SessionResult } from '$lib/server/auth/session';
import type { Database } from '$lib/server/db';

interface SocketServerDeps {
	authApi: {
		getSession: (opts: { headers: Headers }) => Promise<SessionResult>;
	};
	queryMessages: QueryMessagesFn;
	checkMembership: CheckMembershipFn;
}

export function setupSocketServer(httpServer: HttpServer, deps: SocketServerDeps): SocketIOServer {
	const io = new SocketIOServer(httpServer);
	setIO(io);

	io.use(createAuthMiddleware(deps.authApi));

	const handleSync = createSyncHandler({
		queryMessages: deps.queryMessages,
		checkMembership: deps.checkMembership
	});
	const handleJoin = createJoinHandler(deps.checkMembership);
	io.on('connection', (socket) => {
		handleSync(socket);
		handleJoin(socket);
	});

	return io;
}

export function createSocketDeps(
	authApi: SocketServerDeps['authApi'],
	db: Database
): SocketServerDeps {
	return {
		authApi,
		queryMessages: createMessageQuery(db),
		checkMembership: createMembershipCheck(db)
	};
}
