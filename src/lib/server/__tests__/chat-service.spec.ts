import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Server as SocketIOServer } from 'socket.io';
import type { Message } from '$lib/server/db/chat.schema';
import type { Room } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';
import { createChatService } from '../chat-service';

vi.mock('$lib/server/rooms/guards', () => ({
	assertRoomMember: vi.fn()
}));

vi.mock('$lib/server/rooms/send-message', () => ({
	saveMessage: vi.fn(),
	broadcastMessage: vi.fn()
}));

vi.mock('$lib/server/rooms/create-room', () => ({
	createOneToOneRoom: vi.fn()
}));

const { assertRoomMember } = await import('$lib/server/rooms/guards');
const { saveMessage, broadcastMessage } = await import('$lib/server/rooms/send-message');
const { createOneToOneRoom } = await import('$lib/server/rooms/create-room');

const mockAssertRoomMember = vi.mocked(assertRoomMember);
const mockSaveMessage = vi.mocked(saveMessage);
const mockBroadcastMessage = vi.mocked(broadcastMessage);
const mockCreateOneToOneRoom = vi.mocked(createOneToOneRoom);

describe('ChatService', () => {
	const mockDb = {} as Database;
	const mockIO = {} as SocketIOServer;
	const getIO = () => mockIO;

	const service = createChatService({ db: mockDb, getIO });

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('sendMessage', () => {
		const params = { userId: 'user-1', roomId: 'room-1', content: 'hello' };

		const fakeMessage: Message = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: new Date()
		};

		it('assertRoomMember → saveMessage → broadcastMessage 순서로 호출한다', async () => {
			const callOrder: string[] = [];
			mockAssertRoomMember.mockImplementation(async () => {
				callOrder.push('assertRoomMember');
			});
			mockSaveMessage.mockImplementation(async () => {
				callOrder.push('saveMessage');
				return fakeMessage;
			});
			mockBroadcastMessage.mockImplementation(() => {
				callOrder.push('broadcastMessage');
			});

			await service.sendMessage(params);

			expect(callOrder).toEqual(['assertRoomMember', 'saveMessage', 'broadcastMessage']);
		});

		it('assertRoomMember에 db, userId, roomId를 전달한다', async () => {
			mockSaveMessage.mockResolvedValue(fakeMessage);

			await service.sendMessage(params);

			expect(mockAssertRoomMember).toHaveBeenCalledWith(mockDb, 'user-1', 'room-1');
		});

		it('saveMessage에 db, { roomId, senderId, content }를 전달한다', async () => {
			mockSaveMessage.mockResolvedValue(fakeMessage);

			await service.sendMessage(params);

			expect(mockSaveMessage).toHaveBeenCalledWith(mockDb, {
				roomId: 'room-1',
				senderId: 'user-1',
				content: 'hello'
			});
		});

		it('broadcastMessage에 io, roomId, saved를 전달한다', async () => {
			mockSaveMessage.mockResolvedValue(fakeMessage);

			await service.sendMessage(params);

			expect(mockBroadcastMessage).toHaveBeenCalledWith(mockIO, 'room-1', fakeMessage);
		});

		it('저장된 Message를 반환한다', async () => {
			mockSaveMessage.mockResolvedValue(fakeMessage);

			const result = await service.sendMessage(params);

			expect(result).toBe(fakeMessage);
		});

		it('assertRoomMember가 실패하면 saveMessage를 호출하지 않는다', async () => {
			mockAssertRoomMember.mockRejectedValue(new Error('Not a room member'));

			await expect(service.sendMessage(params)).rejects.toThrow('Not a room member');
			expect(mockSaveMessage).not.toHaveBeenCalled();
			expect(mockBroadcastMessage).not.toHaveBeenCalled();
		});
	});

	describe('createRoom', () => {
		const fakeRoom: Room = {
			id: 'room-1',
			participantHash: 'a:b',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		it('createOneToOneRoom에 위임한다', async () => {
			mockCreateOneToOneRoom.mockResolvedValue(fakeRoom);

			const result = await service.createRoom('user-a', 'user-b');

			expect(mockCreateOneToOneRoom).toHaveBeenCalledWith(mockDb, 'user-a', 'user-b');
			expect(result).toBe(fakeRoom);
		});
	});
});
