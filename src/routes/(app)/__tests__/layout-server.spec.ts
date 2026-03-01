import { describe, it, expect } from 'vitest';
import type { User, Session } from 'better-auth/types';

type LoadEvent = {
	locals: { user?: User; session?: Session };
};

async function loadAppLayout() {
	const mod = await import('../+layout.server');
	return mod.load;
}

function makeEvent(user?: Partial<User>, session?: Partial<Session>): LoadEvent {
	return {
		locals: { user: user as User | undefined, session: session as Session | undefined }
	} as LoadEvent;
}

describe('(app) layout server — 인증 가드', () => {
	it('미인증 사용자 (둘 다 없음) → redirect 303 /login', async () => {
		const load = await loadAppLayout();
		const event = makeEvent(undefined, undefined);

		try {
			load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/login');
		}
	});

	it('user만 있고 session 없음 → redirect 303', async () => {
		const load = await loadAppLayout();
		const event = makeEvent({ id: '1', email: 'a@b.com', name: 'Test' }, undefined);

		try {
			load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/login');
		}
	});

	it('session만 있고 user 없음 → redirect 303', async () => {
		const load = await loadAppLayout();
		const event = makeEvent(undefined, { id: 's1', token: 'tok', userId: '1' });

		try {
			load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/login');
		}
	});

	it('인증 사용자 (둘 다 있음) → user 반환', async () => {
		const load = await loadAppLayout();
		const user = { id: '1', email: 'user@example.com', name: '홍길동' };
		const session = { id: 's1', token: 'tok', userId: '1' };
		const event = makeEvent(user, session);

		const result = load(event as never);
		expect(result).toEqual({ user, rooms: [] });
	});
});
