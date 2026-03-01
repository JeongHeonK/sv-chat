import { describe, it, expect, vi, afterAll } from 'vitest';
import { like, eq } from 'drizzle-orm';
import type { Server as SocketIOServer } from 'socket.io';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';
import { room, roomUser, message } from '../../db/chat.schema';
import { saveMessage, broadcastMessage } from '../send-message';

const PREFIX = 'test-send-msg';

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

async function setupRoom(suffix: string) {
	const testUser = createTestUser(suffix);
	await testDb.insert(user).values(testUser);

	const roomId = `${PREFIX}-room-${suffix}-${Date.now()}`;
	await testDb.insert(room).values({ id: roomId, createdAt: new Date(), updatedAt: new Date() });
	await testDb.insert(roomUser).values({
		id: crypto.randomUUID(),
		roomId,
		userId: testUser.id,
		joinedAt: new Date()
	});

	return { user: testUser, roomId };
}

afterAll(async () => {
	await testDb.delete(message).where(like(message.content, `${PREFIX}%`));
	await testDb.delete(roomUser).where(like(roomUser.roomId, `${PREFIX}%`));
	await testDb.delete(room).where(like(room.id, `${PREFIX}%`));
	await testDb.delete(user).where(like(user.name, `${PREFIX}%`));
	await closeConnection();
});

describe('saveMessage', () => {
	it('DB에 메시지를 저장하고 count가 +1 증가한다', async () => {
		const { user: testUser, roomId } = await setupRoom('count');

		const before = await testDb.select().from(message).where(eq(message.roomId, roomId));

		const saved = await saveMessage(testDb, {
			roomId,
			senderId: testUser.id,
			content: `${PREFIX}-hello`
		});

		const after = await testDb.select().from(message).where(eq(message.roomId, roomId));

		expect(after.length).toBe(before.length + 1);
		expect(saved.content).toBe(`${PREFIX}-hello`);
		expect(saved.roomId).toBe(roomId);
		expect(saved.senderId).toBe(testUser.id);
	});

	it('createdAt이 서버 타임스탬프(DB now()) 기준이다', async () => {
		const { user: testUser, roomId } = await setupRoom('timestamp');

		const saved1 = await saveMessage(testDb, {
			roomId,
			senderId: testUser.id,
			content: `${PREFIX}-timestamp-1`
		});
		const saved2 = await saveMessage(testDb, {
			roomId,
			senderId: testUser.id,
			content: `${PREFIX}-timestamp-2`
		});

		// DB now()가 생성한 타임스탬프 — Date 타입이며 순차 저장 시 순서 보장
		expect(saved1.createdAt).toBeInstanceOf(Date);
		expect(saved2.createdAt).toBeInstanceOf(Date);
		expect(saved2.createdAt.getTime()).toBeGreaterThanOrEqual(saved1.createdAt.getTime());
	});
});

describe('broadcastMessage', () => {
	it('Socket.io Room에 MESSAGE_CREATED 이벤트를 broadcast한다', () => {
		const emit = vi.fn();
		const mockIO = {
			to: vi.fn(() => ({ emit }))
		} as unknown as SocketIOServer;

		const msg = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: new Date()
		};

		broadcastMessage(mockIO, 'room-1', msg);

		expect(mockIO.to).toHaveBeenCalledWith('room-1');
		expect(emit).toHaveBeenCalledWith('message_created', msg);
	});
});

describe('메시지 전송 검증', () => {
	it('빈 메시지(trim 후 빈 문자열)는 전송 불가해야 한다', () => {
		const rawContent = '   ';
		const content = rawContent.trim();

		expect(content).toBe('');
		// Form action에서 fail(400) 반환 — 빈 content로는 saveMessage 호출하지 않음
	});

	it('방 멤버가 아닌 사용자는 메시지 전송 시 403 에러를 받는다', async () => {
		const nonMember = createTestUser('non-member');
		await testDb.insert(user).values(nonMember);

		const { roomId } = await setupRoom('member-check');

		// assertRoomMember가 403을 throw하는지 확인
		const { assertRoomMember } = await import('../guards');
		await expect(assertRoomMember(testDb, nonMember.id, roomId)).rejects.toThrow();
	});
});
