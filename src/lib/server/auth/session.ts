import type { Session, User } from 'better-auth/types';

export type SessionResult = { user: User; session: Session } | null;

type AuthAPI = {
	getSession: (opts: { headers: Headers }) => Promise<SessionResult>;
};

export async function resolveSession(api: AuthAPI, headers: Headers): Promise<SessionResult> {
	try {
		return await api.getSession({ headers });
	} catch {
		return null;
	}
}
