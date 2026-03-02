import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest';
import { like, eq } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser } from '../../db/chat.schema';
import { leaveRoom } from '../leave-room';

const PREFIX = 'test-leave-room';

// Socket.io mock
const mockEmit = vi.fn();
const mockTo = vi.fn(() => ({ emit: mockEmit }));
vi.mock('$lib/server/socket/io', () => ({
	getIO: () => ({ to: mockTo })
}));

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

async function createTestRoom(userA: { id: string }, userB: { id: string }) {
	const roomId = `${PREFIX}-room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
	await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
	await testDb.insert(roomUser).values([
		{ id: crypto.randomUUID(), roomId, userId: userA.id, joinedAt: new Date() },
		{ id: crypto.randomUUID(), roomId, userId: userB.id, joinedAt: new Date() }
	]);
	return roomId;
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterAll(async () => {
	await testDb.delete(roomUser).where(like(roomUser.roomId, `${PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('leaveRoom', () => {
	it('사용자의 roomUser 레코드가 삭제된다', async () => {
		const userA = createTestUser('leave-a');
		const userB = createTestUser('leave-b');
		await testDb.insert(user).values([userA, userB]);
		const roomId = await createTestRoom(userA, userB);

		await leaveRoom(testDb, userA.id, roomId);

		const members = await testDb.select().from(roomUser).where(eq(roomUser.roomId, roomId));
		expect(members).toHaveLength(1);
		expect(members[0]?.userId).toBe(userB.id);
	});

	it('남은 멤버가 있으면 room:left 이벤트를 전송한다', async () => {
		const userA = createTestUser('left-event-a');
		const userB = createTestUser('left-event-b');
		await testDb.insert(user).values([userA, userB]);
		const roomId = await createTestRoom(userA, userB);

		await leaveRoom(testDb, userA.id, roomId);

		expect(mockTo).toHaveBeenCalledWith(roomId);
		expect(mockEmit).toHaveBeenCalledWith('room:left', { roomId, userId: userA.id });
	});

	it('마지막 멤버가 나가면 room이 삭제된다', async () => {
		const userA = createTestUser('last-a');
		const userB = createTestUser('last-b');
		await testDb.insert(user).values([userA, userB]);
		const roomId = await createTestRoom(userA, userB);

		// 첫 번째 사용자 나감
		await leaveRoom(testDb, userA.id, roomId);
		// 두 번째 사용자 나감
		await leaveRoom(testDb, userB.id, roomId);

		const rooms = await testDb.select().from(room).where(eq(room.id, roomId));
		expect(rooms).toHaveLength(0);
	});

	it('마지막 멤버가 나가면 room:left 이벤트를 전송하지 않는다', async () => {
		const userA = createTestUser('noevent-a');
		const userB = createTestUser('noevent-b');
		await testDb.insert(user).values([userA, userB]);
		const roomId = await createTestRoom(userA, userB);

		await leaveRoom(testDb, userA.id, roomId);
		vi.clearAllMocks();

		await leaveRoom(testDb, userB.id, roomId);

		expect(mockEmit).not.toHaveBeenCalled();
	});
});
