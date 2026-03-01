import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser, message } from '../../db/chat.schema';
import { getUserRooms } from '../queries';

const TEST_PREFIX = 'test-room-queries';

function createTestUser(suffix: string) {
	return {
		id: crypto.randomUUID(),
		name: `${TEST_PREFIX}-user-${suffix}`,
		email: `${TEST_PREFIX}-${suffix}-${Date.now()}@example.com`,
		emailVerified: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

afterAll(async () => {
	await testDb.delete(message).where(like(message.content, `${TEST_PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${TEST_PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${TEST_PREFIX}%`));
	await closeConnection();
});

describe('getUserRooms', () => {
	it('유저가 참여 중인 채팅방 목록을 반환한다', async () => {
		const user1 = createTestUser('1');
		const user2 = createTestUser('2');
		await testDb.insert(user).values([user1, user2]);

		const roomId = `${TEST_PREFIX}-room-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values([
			{ id: crypto.randomUUID(), roomId, userId: user1.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId, userId: user2.id, joinedAt: new Date() }
		]);
		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: user2.id,
			content: `${TEST_PREFIX}-hello`,
			createdAt: new Date()
		});

		const rooms = await getUserRooms(testDb, user1.id);

		expect(rooms).toHaveLength(1);
		expect(rooms[0].id).toBe(roomId);
	});

	it('최근 메시지 순으로 정렬된다', async () => {
		const user1 = createTestUser('sort-1');
		const user2 = createTestUser('sort-2');
		await testDb.insert(user).values([user1, user2]);

		const oldRoomId = `${TEST_PREFIX}-old-${Date.now()}`;
		const newRoomId = `${TEST_PREFIX}-new-${Date.now()}`;

		await testDb.insert(room).values([
			{ id: oldRoomId, createdAt: new Date(), updatedAt: new Date() },
			{ id: newRoomId, createdAt: new Date(), updatedAt: new Date() }
		]);
		await testDb.insert(roomUser).values([
			{ id: crypto.randomUUID(), roomId: oldRoomId, userId: user1.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId: oldRoomId, userId: user2.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId: newRoomId, userId: user1.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId: newRoomId, userId: user2.id, joinedAt: new Date() }
		]);

		const oldDate = new Date('2024-01-01');
		const newDate = new Date('2024-06-01');

		await testDb.insert(message).values([
			{
				id: crypto.randomUUID(),
				roomId: oldRoomId,
				senderId: user2.id,
				content: `${TEST_PREFIX}-old-msg`,
				createdAt: oldDate
			},
			{
				id: crypto.randomUUID(),
				roomId: newRoomId,
				senderId: user2.id,
				content: `${TEST_PREFIX}-new-msg`,
				createdAt: newDate
			}
		]);

		const rooms = await getUserRooms(testDb, user1.id);

		expect(rooms.length).toBeGreaterThanOrEqual(2);
		const newIdx = rooms.findIndex((r) => r.id === newRoomId);
		const oldIdx = rooms.findIndex((r) => r.id === oldRoomId);
		expect(newIdx).toBeLessThan(oldIdx);
	});

	it('참여 중인 방이 없으면 빈 배열을 반환한다', async () => {
		const lonelyUser = createTestUser('lonely');
		await testDb.insert(user).values(lonelyUser);

		const rooms = await getUserRooms(testDb, lonelyUser.id);

		expect(rooms).toEqual([]);
	});

	it('상대방 이름과 마지막 메시지를 포함한다', async () => {
		const user1 = createTestUser('detail-1');
		const user2 = createTestUser('detail-2');
		await testDb.insert(user).values([user1, user2]);

		const roomId = `${TEST_PREFIX}-detail-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values([
			{ id: crypto.randomUUID(), roomId, userId: user1.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId, userId: user2.id, joinedAt: new Date() }
		]);

		const msgTime = new Date('2024-03-15T10:30:00Z');
		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: user2.id,
			content: `${TEST_PREFIX}-안녕하세요`,
			createdAt: msgTime
		});

		const rooms = await getUserRooms(testDb, user1.id);
		const targetRoom = rooms.find((r) => r.id === roomId);

		expect(targetRoom).toBeDefined();
		expect(targetRoom!.name).toBe(user2.name);
		expect(targetRoom!.lastMessage).toBe(`${TEST_PREFIX}-안녕하세요`);
		expect(targetRoom!.lastMessageAt).toEqual(msgTime);
	});
});
