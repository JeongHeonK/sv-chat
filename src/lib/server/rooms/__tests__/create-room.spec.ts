import { describe, it, expect, afterAll } from 'vitest';
import { like, eq } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser } from '../../db/chat.schema';
import { createOneToOneRoom } from '../create-room';
import { searchUsers } from '../create-room';

const PREFIX = 'test-create-room';

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
	await testDb.delete(roomUser).where(like(roomUser.roomId, `${PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	// participantHash로 생성된 room도 정리
	await testDb.delete(room).where(like(room.participantHash, `%${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('searchUsers', () => {
	it('닉네임으로 사용자를 검색한다', async () => {
		const testUser = createTestUser('search-name');
		await testDb.insert(user).values(testUser);

		const results = await searchUsers(testDb, 'search-name', testUser.id);
		// 자기 자신은 제외
		expect(results.find((u) => u.id === testUser.id)).toBeUndefined();
	});

	it('이메일로 사용자를 검색한다', async () => {
		const targetUser = createTestUser('search-email');
		await testDb.insert(user).values(targetUser);
		const searcherUser = createTestUser('searcher');
		await testDb.insert(user).values(searcherUser);

		const results = await searchUsers(testDb, targetUser.email, searcherUser.id);
		expect(results.some((u) => u.id === targetUser.id)).toBe(true);
	});

	it('빈 쿼리는 빈 배열을 반환한다', async () => {
		const testUser = createTestUser('search-empty');
		await testDb.insert(user).values(testUser);

		const results = await searchUsers(testDb, '', testUser.id);
		expect(results).toEqual([]);
	});
});

describe('createOneToOneRoom', () => {
	it('1:1 Room + RoomUser 2개가 생성된다', async () => {
		const userA = createTestUser('room-a');
		const userB = createTestUser('room-b');
		await testDb.insert(user).values([userA, userB]);

		const result = await createOneToOneRoom(testDb, userA.id, userB.id);

		// room이 존재하는지 확인
		const rooms = await testDb.select().from(room).where(eq(room.id, result.id)).limit(1);
		expect(rooms).toHaveLength(1);

		// roomUser 2개가 존재하는지 확인
		const members = await testDb.select().from(roomUser).where(eq(roomUser.roomId, result.id));
		expect(members).toHaveLength(2);
		const memberIds = members.map((m) => m.userId).sort();
		expect(memberIds).toEqual([userA.id, userB.id].sort());
	});

	it('이미 존재하는 1:1 대화방 중복 생성 시 기존 방을 반환한다', async () => {
		const userA = createTestUser('dup-a');
		const userB = createTestUser('dup-b');
		await testDb.insert(user).values([userA, userB]);

		const first = await createOneToOneRoom(testDb, userA.id, userB.id);
		const second = await createOneToOneRoom(testDb, userB.id, userA.id);

		// 같은 방 ID를 반환해야 함
		expect(second.id).toBe(first.id);

		// roomUser는 여전히 2개만 존재
		const members = await testDb.select().from(roomUser).where(eq(roomUser.roomId, first.id));
		expect(members).toHaveLength(2);
	});

	it('participantHash가 정렬된 userId 조합으로 저장된다', async () => {
		const userA = createTestUser('hash-a');
		const userB = createTestUser('hash-b');
		await testDb.insert(user).values([userA, userB]);

		const result = await createOneToOneRoom(testDb, userA.id, userB.id);

		const rooms = await testDb.select().from(room).where(eq(room.id, result.id)).limit(1);

		const expectedHash = [userA.id, userB.id].sort().join(':');
		expect(rooms[0]?.participantHash).toBe(expectedHash);
	});
});
