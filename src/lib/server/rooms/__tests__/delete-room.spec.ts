import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest';
import { like, eq } from 'drizzle-orm';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser, message } from '../../db/chat.schema';
import { deleteRoom } from '../delete-room';

const PREFIX = 'test-delete-room';

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

beforeEach(() => {
	vi.clearAllMocks();
});

afterAll(async () => {
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('deleteRoom', () => {
	it('room이 삭제된다', async () => {
		const userA = createTestUser('del-a');
		await testDb.insert(user).values(userA);
		const roomId = `${PREFIX}-del-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: userA.id,
			joinedAt: new Date()
		});

		await deleteRoom(testDb, roomId);

		const rooms = await testDb.select().from(room).where(eq(room.id, roomId));
		expect(rooms).toHaveLength(0);
	});

	it('cascade로 roomUser도 삭제된다', async () => {
		const userA = createTestUser('cascade-ru-a');
		const userB = createTestUser('cascade-ru-b');
		await testDb.insert(user).values([userA, userB]);
		const roomId = `${PREFIX}-cascade-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values([
			{ id: crypto.randomUUID(), roomId, userId: userA.id, joinedAt: new Date() },
			{ id: crypto.randomUUID(), roomId, userId: userB.id, joinedAt: new Date() }
		]);

		await deleteRoom(testDb, roomId);

		const members = await testDb.select().from(roomUser).where(eq(roomUser.roomId, roomId));
		expect(members).toHaveLength(0);
	});

	it('cascade로 message도 삭제된다', async () => {
		const userA = createTestUser('cascade-msg');
		await testDb.insert(user).values(userA);
		const roomId = `${PREFIX}-msg-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
		await testDb.insert(roomUser).values({
			id: crypto.randomUUID(),
			roomId,
			userId: userA.id,
			joinedAt: new Date()
		});
		await testDb.insert(message).values({
			id: crypto.randomUUID(),
			roomId,
			senderId: userA.id,
			content: 'test message',
			createdAt: new Date()
		});

		await deleteRoom(testDb, roomId);

		const messages = await testDb.select().from(message).where(eq(message.roomId, roomId));
		expect(messages).toHaveLength(0);
	});

	it('삭제 전 room:deleted 이벤트를 전송한다', async () => {
		const userA = createTestUser('event');
		await testDb.insert(user).values(userA);
		const roomId = `${PREFIX}-event-${Date.now()}`;
		await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });

		await deleteRoom(testDb, roomId);

		expect(mockTo).toHaveBeenCalledWith(roomId);
		expect(mockEmit).toHaveBeenCalledWith('room:deleted', { roomId });
	});
});
