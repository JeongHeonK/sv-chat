import type { Socket } from 'socket.io';
import type { SessionResult } from '$lib/server/auth/session';

type AuthAPI = {
	getSession: (opts: { headers: Headers }) => Promise<SessionResult>;
};

export function createAuthMiddleware(authApi: AuthAPI) {
	return async (socket: Socket, next: (err?: Error) => void) => {
		const cookie = socket.handshake.headers.cookie;
		if (!cookie) return next(new Error('Authentication required'));

		try {
			const session = await authApi.getSession({ headers: new Headers({ cookie }) });
			if (!session) return next(new Error('Invalid session'));

			socket.data.user = session.user;
			socket.data.session = session.session;
			next();
		} catch {
			next(new Error('Invalid session'));
		}
	};
}
