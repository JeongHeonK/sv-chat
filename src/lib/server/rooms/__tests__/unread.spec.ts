import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser, message } from '../../db/chat.schema';
import { getUnreadCounts, updateLastReadAt } from '../unread';

const PREFIX = 'test-unread';

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

async function setupRoomWithUsers(suffix: string) {
	const user1 = createTestUser(`${suffix}-1`);
	const user2 = createTestUser(`${suffix}-2`);
	await testDb.insert(user).values([user1, user2]);

	const roomId = `${PREFIX}-room-${suffix}-${Date.now()}`;
	await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });

	const now = new Date();
	await testDb.insert(roomUser).values([
		{ id: crypto.randomUUID(), roomId, userId: user1.id, joinedAt: now, lastReadAt: now },
		{ id: crypto.randomUUID(), roomId, userId: user2.id, joinedAt: now, lastReadAt: now }
	]);

	return { user1, user2, roomId };
}

afterAll(async () => {
	await testDb.delete(message).where(like(message.content, `${PREFIX}%`));
	await testDb.delete(roomUser).where(like(roomUser.roomId, `${PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('getUnreadCounts', () => {
	it('채팅방별 안읽음 메시지 카운트를 반환한다', async () => {
		const { user1, user2, roomId } = await setupRoomWithUsers('count');

		// lastReadAt 이후 메시지 2개 추가
		const pastTime = new Date('2024-01-01T00:00:00Z');
		await updateLastReadAt(testDb, user1.id, roomId, pastTime);

		await testDb.insert(message).values([
			{
				id: crypto.randomUUID(),
				roomId,
				senderId: user2.id,
				content: `${PREFIX}-msg-1`,
				createdAt: new Date('2024-06-01T00:00:00Z')
			},
			{
				id: crypto.randomUUID(),
				roomId,
				senderId: user2.id,
				content: `${PREFIX}-msg-2`,
				createdAt: new Date('2024-06-02T00:00:00Z')
			}
		]);

		const counts = await getUnreadCounts(testDb, user1.id);
		const roomCount = counts.find((c) => c.roomId === roomId);

		expect(roomCount).toBeDefined();
		expect(roomCount!.count).toBe(2);
	});

	it('채팅방 입장 시 lastReadAt 갱신 후 카운트가 0이 된다', async () => {
		const { user1, user2, roomId } = await setupRoomWithUsers('read');

		// 과거 시점으로 lastReadAt 설정
		await updateLastReadAt(testDb, user1.id, roomId, new Date('2024-01-01T00:00:00Z'));

		// 메시지 추가
		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: user2.id,
			content: `${PREFIX}-msg-read`,
			createdAt: new Date('2024-06-01T00:00:00Z')
		});

		// 읽음 처리 (현재 시점으로 갱신)
		await updateLastReadAt(testDb, user1.id, roomId);

		const counts = await getUnreadCounts(testDb, user1.id);
		const roomCount = counts.find((c) => c.roomId === roomId);

		// 카운트가 0이거나 해당 방이 결과에 없음
		if (roomCount) {
			expect(roomCount.count).toBe(0);
		} else {
			expect(roomCount).toBeUndefined();
		}
	});

	it('새 메시지 수신 시 카운트가 증가한다', async () => {
		const { user1, user2, roomId } = await setupRoomWithUsers('increment');

		// 읽음 처리
		const readTime = new Date('2024-06-01T00:00:00Z');
		await updateLastReadAt(testDb, user1.id, roomId, readTime);

		// 읽은 시점 이후 메시지 1개
		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: user2.id,
			content: `${PREFIX}-msg-new-1`,
			createdAt: new Date('2024-06-02T00:00:00Z')
		});

		const counts1 = await getUnreadCounts(testDb, user1.id);
		const count1 = counts1.find((c) => c.roomId === roomId);
		expect(count1).toBeDefined();
		expect(count1!.count).toBe(1);

		// 추가 메시지 1개 → 카운트 2
		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: user2.id,
			content: `${PREFIX}-msg-new-2`,
			createdAt: new Date('2024-06-03T00:00:00Z')
		});

		const counts2 = await getUnreadCounts(testDb, user1.id);
		const count2 = counts2.find((c) => c.roomId === roomId);
		expect(count2).toBeDefined();
		expect(count2!.count).toBe(2);
	});
});
