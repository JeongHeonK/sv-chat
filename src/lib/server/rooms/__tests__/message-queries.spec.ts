import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser, message } from '../../db/chat.schema';
import { getMessages } from '../messages';

const PREFIX = 'test-msg-queries';

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
	await testDb.delete(message).where(like(message.content, `${PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('getMessages', () => {
	it('특정 방의 메시지를 오래된 순으로 반환한다', async () => {
		const user1 = createTestUser('msg-1');
		const user2 = createTestUser('msg-2');
		await testDb.insert(user).values([user1, user2]);

		const roomId = `${PREFIX}-room-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values([
			{ id: crypto.randomUUID(), roomId, userId: user1.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId, userId: user2.id, joinedAt: new Date() }
		]);

		const t1 = new Date('2024-01-01T10:00:00Z');
		const t2 = new Date('2024-01-01T11:00:00Z');
		const t3 = new Date('2024-01-01T12:00:00Z');

		await testDb.insert(message).values([
			{
				id: crypto.randomUUID(),
				roomId,
				senderId: user1.id,
				content: `${PREFIX}-first`,
				createdAt: t1
			},
			{
				id: crypto.randomUUID(),
				roomId,
				senderId: user2.id,
				content: `${PREFIX}-second`,
				createdAt: t2
			},
			{
				id: crypto.randomUUID(),
				roomId,
				senderId: user1.id,
				content: `${PREFIX}-third`,
				createdAt: t3
			}
		]);

		const messages = await getMessages(testDb, roomId);

		expect(messages).toHaveLength(3);
		expect(messages[0].content).toBe(`${PREFIX}-first`);
		expect(messages[1].content).toBe(`${PREFIX}-second`);
		expect(messages[2].content).toBe(`${PREFIX}-third`);
		expect(messages[0].senderName).toBe(user1.name);
		expect(messages[1].senderName).toBe(user2.name);
	});

	it('before cursor로 이전 메시지만 조회한다', async () => {
		const user1 = createTestUser('cursor-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-cursor-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: user1.id,
			joinedAt: new Date()
		});

		const times = Array.from({ length: 5 }, (_, i) => new Date(`2024-01-0${i + 1}T10:00:00Z`));

		await testDb.insert(message).values(
			times.map((t, i) => ({
				id: crypto.randomUUID(),
				roomId,
				senderId: user1.id,
				content: `${PREFIX}-cursor-msg-${i}`,
				createdAt: t
			}))
		);

		// before = 3번째 시간 → 0, 1번째만 반환
		const messages = await getMessages(testDb, roomId, { before: times[2] });

		expect(messages).toHaveLength(2);
		expect(messages[0].content).toBe(`${PREFIX}-cursor-msg-0`);
		expect(messages[1].content).toBe(`${PREFIX}-cursor-msg-1`);
	});

	it('limit 파라미터로 반환 수를 제한한다', async () => {
		const user1 = createTestUser('limit-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-limit-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: user1.id,
			joinedAt: new Date()
		});

		await testDb.insert(message).values(
			Array.from({ length: 10 }, (_, i) => ({
				id: crypto.randomUUID(),
				roomId,
				senderId: user1.id,
				content: `${PREFIX}-limit-msg-${i}`,
				createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`)
			}))
		);

		const messages = await getMessages(testDb, roomId, { limit: 3 });

		// 최신 3개를 오래된 순으로
		expect(messages).toHaveLength(3);
		expect(messages[0].content).toBe(`${PREFIX}-limit-msg-7`);
		expect(messages[2].content).toBe(`${PREFIX}-limit-msg-9`);
	});

	it('메시지 없는 방은 빈 배열을 반환한다', async () => {
		const user1 = createTestUser('empty-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-empty-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });

		const messages = await getMessages(testDb, roomId);

		expect(messages).toEqual([]);
	});
});
