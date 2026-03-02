import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, Session } from 'better-auth/types';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

const mockUpdateLastReadAt = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/server/rooms', () => ({
	getUserRooms: vi.fn().mockResolvedValue([]),
	getUnreadCounts: vi.fn().mockResolvedValue([]),
	updateLastReadAt: (...args: unknown[]) => mockUpdateLastReadAt(...args)
}));

type LoadEvent = {
	locals: { user?: User; session?: Session };
	depends: (key: string) => void;
	url: URL;
};

function makeEvent(user?: Partial<User>, session?: Partial<Session>, pathname = '/'): LoadEvent {
	return {
		locals: { user: user as User | undefined, session: session as Session | undefined },
		depends: vi.fn(),
		url: new URL(`http://localhost${pathname}`)
	} as unknown as LoadEvent;
}

describe('(app) layout server — 인증 가드', () => {
	let load: (event: unknown) => Promise<unknown>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import('../+layout.server');
		load = mod.load as (event: unknown) => Promise<unknown>;
	});

	it('미인증 사용자 (둘 다 없음) → redirect 303 /login', async () => {
		const event = makeEvent(undefined, undefined);

		try {
			await load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/login');
		}
	});

	it('user만 있고 session 없음 → redirect 303', async () => {
		const event = makeEvent({ id: '1', email: 'a@b.com', name: 'Test' }, undefined);

		try {
			await load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/login');
		}
	});

	it('session만 있고 user 없음 → redirect 303', async () => {
		const event = makeEvent(undefined, { id: 's1', token: 'tok', userId: '1' });

		try {
			await load(event as never);
			expect.unreachable('redirect가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number; location: string };
			expect(err.status).toBe(303);
			expect(err.location).toBe('/login');
		}
	});

	it('인증 사용자 → user + rooms 반환', async () => {
		const user = { id: '1', email: 'user@example.com', name: '홍길동' };
		const session = { id: 's1', token: 'tok', userId: '1' };
		const event = makeEvent(user, session);

		const result = await load(event as never);
		expect(result).toEqual({ user, rooms: [] });
	});

	it('채팅방 페이지에서 updateLastReadAt을 호출한다', async () => {
		const user = { id: '1', email: 'user@example.com', name: '홍길동' };
		const session = { id: 's1', token: 'tok', userId: '1' };
		const event = makeEvent(user, session, '/chat/room-123');

		await load(event as never);
		expect(mockUpdateLastReadAt).toHaveBeenCalledWith({}, '1', 'room-123');
	});

	it('메인 페이지에서는 updateLastReadAt을 호출하지 않는다', async () => {
		const user = { id: '1', email: 'user@example.com', name: '홍길동' };
		const session = { id: 's1', token: 'tok', userId: '1' };
		const event = makeEvent(user, session, '/');

		await load(event as never);
		expect(mockUpdateLastReadAt).not.toHaveBeenCalled();
	});
});
