import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser } from '../../db/chat.schema';
import { assertRoomMember } from '../guards';

const PREFIX = 'test-room-guards';

function createTestUser(suffix: string) {
	return {
		id: crypto.randomUUID(),
		name: `${PREFIX}-user-${suffix}`,
		email: `${PREFIX}-${suffix}-${Date.now()}@example.com`,
		emailVerified: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

afterAll(async () => {
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('assertRoomMember', () => {
	it('멤버인 경우 에러 없이 통과한다', async () => {
		const user1 = createTestUser('member-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-member-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: user1.id,
			joinedAt: new Date()
		});

		await expect(assertRoomMember(testDb, user1.id, roomId)).resolves.toBeUndefined();
	});

	it('비멤버인 경우 403 에러를 던진다', async () => {
		const user1 = createTestUser('nonmember-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-nonmember-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });

		try {
			await assertRoomMember(testDb, user1.id, roomId);
			expect.unreachable('403 에러가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number };
			expect(err.status).toBe(403);
		}
	});

	it('존재하지 않는 roomId는 404 에러를 던진다', async () => {
		const user1 = createTestUser('notfound-1');
		await testDb.insert(user).values(user1);

		try {
			await assertRoomMember(testDb, user1.id, 'nonexistent-room-id');
			expect.unreachable('404 에러가 발생해야 합니다');
		} catch (e: unknown) {
			const err = e as { status: number };
			expect(err.status).toBe(404);
		}
	});
});
