import { describe, it, expect } from 'vitest';
import type { User, Session } from 'better-auth/types';
import { requireAuth } from '../guards';

type GuardEvent = Parameters<typeof requireAuth>[0];

function makeEvent(
	user?: Partial<User>,
	session?: Partial<Session>,
	pathname = '/protected'
): GuardEvent {
	return {
		locals: { user: user as User | undefined, session: session as Session | undefined },
		url: new URL(`http://localhost${pathname}`)
	} as GuardEvent;
}

describe('requireAuth', () => {
	it('비로그인 → redirect(307, /login)', () => {
		const event = makeEvent(undefined, undefined);
		expect(() => requireAuth(event)).toThrow();
		try {
			requireAuth(event);
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(307);
			expect(err.location).toContain('/login');
		}
	});

	it('비로그인 + 원래 경로 → redirectTo 쿼리 파라미터 포함', () => {
		const event = makeEvent(undefined, undefined, '/chat/room-1');
		try {
			requireAuth(event);
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.location).toContain('redirectTo=');
			expect(decodeURIComponent(err.location)).toContain('/chat/room-1');
		}
	});

	it('로그인 상태 → user 반환', () => {
		const user = { id: '1', email: 'user@example.com', name: 'Test' };
		const session = { id: 's1', token: 'tok', userId: '1' };
		const event = makeEvent(user, session);

		const result = requireAuth(event);
		expect(result.user).toEqual(user);
		expect(result.session).toEqual(session);
	});
});
