import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser, message } from '../../db/chat.schema';
import { searchMessages } from '../search';

const PREFIX = 'test-search-msg';

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

async function setupRoomWithMessages(suffix: string) {
	const user1 = createTestUser(`${suffix}-1`);
	const user2 = createTestUser(`${suffix}-2`);
	await testDb.insert(user).values([user1, user2]);

	const roomId = `${PREFIX}-room-${suffix}-${Date.now()}`;
	await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
	await testDb.insert(roomUser).values([
		{ id: crypto.randomUUID(), roomId, userId: user1.id, joinedAt: new Date() },
		{ id: crypto.randomUUID(), roomId, userId: user2.id, joinedAt: new Date() }
	]);

	const msgs = [
		{
			id: crypto.randomUUID(),
			roomId,
			senderId: user1.id,
			content: `${PREFIX}-안녕하세요 반갑습니다`,
			createdAt: new Date('2024-01-01T10:00:00Z')
		},
		{
			id: crypto.randomUUID(),
			roomId,
			senderId: user2.id,
			content: `${PREFIX}-오늘 날씨가 좋네요`,
			createdAt: new Date('2024-01-01T11:00:00Z')
		},
		{
			id: crypto.randomUUID(),
			roomId,
			senderId: user1.id,
			content: `${PREFIX}-안녕히 가세요`,
			createdAt: new Date('2024-01-01T12:00:00Z')
		}
	];
	await testDb.insert(message).values(msgs);

	return { user1, user2, roomId, messages: msgs };
}

afterAll(async () => {
	await testDb.delete(message).where(like(message.content, `${PREFIX}%`));
	await testDb.delete(roomUser).where(like(roomUser.roomId, `${PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('searchMessages', () => {
	it('키워드로 매칭되는 메시지를 반환한다', async () => {
		const { user1 } = await setupRoomWithMessages('keyword');

		const results = await searchMessages(testDb, user1.id, '안녕');

		expect(results.messages.length).toBeGreaterThanOrEqual(2);
		expect(results.messages.every((m) => m.content.includes('안녕'))).toBe(true);
	});

	it('검색 결과에 roomId와 senderName이 포함된다', async () => {
		const { user1, roomId } = await setupRoomWithMessages('context');

		const results = await searchMessages(testDb, user1.id, '날씨');

		expect(results.messages).toHaveLength(1);
		expect(results.messages[0].roomId).toBe(roomId);
		expect(results.messages[0].senderName).toEqual(expect.any(String));
	});

	it('사용자가 참여하지 않은 방의 메시지는 검색되지 않는다', async () => {
		await setupRoomWithMessages('security');

		// 방에 참여하지 않은 새로운 사용자
		const outsider = createTestUser('outsider');
		await testDb.insert(user).values(outsider);

		const results = await searchMessages(testDb, outsider.id, PREFIX);

		expect(results.messages).toHaveLength(0);
	});

	it('매칭 없을 때 빈 배열을 반환한다', async () => {
		const { user1 } = await setupRoomWithMessages('empty');

		const results = await searchMessages(testDb, user1.id, 'zzz-no-match-zzz');

		expect(results.messages).toHaveLength(0);
		expect(results.total).toBe(0);
	});

	it('offset/limit 페이지네이션이 동작한다', async () => {
		const user1 = createTestUser('page-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-room-page-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: user1.id,
			joinedAt: new Date()
		});

		// 5개 메시지 — 모두 같은 키워드 포함
		await testDb.insert(message).values(
			Array.from({ length: 5 }, (_, i) => ({
				id: crypto.randomUUID(),
				roomId,
				senderId: user1.id,
				content: `${PREFIX}-page-item-${i}`,
				createdAt: new Date(`2024-01-0${i + 1}T10:00:00Z`)
			}))
		);

		const page1 = await searchMessages(testDb, user1.id, `${PREFIX}-page-item`, {
			offset: 0,
			limit: 2
		});
		const page2 = await searchMessages(testDb, user1.id, `${PREFIX}-page-item`, {
			offset: 2,
			limit: 2
		});
		const page3 = await searchMessages(testDb, user1.id, `${PREFIX}-page-item`, {
			offset: 4,
			limit: 2
		});

		expect(page1.messages).toHaveLength(2);
		expect(page2.messages).toHaveLength(2);
		expect(page3.messages).toHaveLength(1);
		expect(page1.total).toBe(5);
	});

	it('대소문자 구분 없이 검색한다 (ILIKE)', async () => {
		const user1 = createTestUser('ilike-1');
		await testDb.insert(user).values(user1);

		const roomId = `${PREFIX}-room-ilike-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: user1.id,
			joinedAt: new Date()
		});

		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: user1.id,
			content: `${PREFIX}-Hello World`,
			createdAt: new Date()
		});

		const results = await searchMessages(testDb, user1.id, 'hello world');

		expect(results.messages).toHaveLength(1);
		expect(results.messages[0].content).toContain('Hello World');
	});
});
