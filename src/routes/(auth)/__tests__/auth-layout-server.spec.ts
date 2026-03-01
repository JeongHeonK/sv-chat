import { describe, it, expect } from 'vitest';
import type { User, Session } from 'better-auth/types';

type LoadEvent = {
	locals: { user?: User; session?: Session };
};

async function loadAuthLayout() {
	const mod = await import('../+layout.server');
	return mod.load;
}

function makeEvent(user?: Partial<User>, session?: Partial<Session>): LoadEvent {
	return {
		locals: { user: user as User | undefined, session: session as Session | undefined }
	} as LoadEvent;
}

describe('(auth) layout server — 인증된 사용자 redirect', () => {
	it('인증 사용자 → / 로 redirect 303', async () => {
		const load = await loadAuthLayout();
		const user = { id: '1', email: 'user@example.com', name: '홍길동' };
		const session = { id: 's1', token: 'tok', userId: '1' };
		const event = makeEvent(user, session);

		try {
			load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/');
		}
	});

	it('미인증 사용자 → redirect 없이 통과', async () => {
		const load = await loadAuthLayout();
		const event = makeEvent(undefined, undefined);

		expect(() => load(event as never)).not.toThrow();
	});
});
