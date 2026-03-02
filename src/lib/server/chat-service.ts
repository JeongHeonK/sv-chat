import type { Server as SocketIOServer } from 'socket.io';
import type { Message } from '$lib/server/db/chat.schema';
import type { Room } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';
import { assertRoomMember } from '$lib/server/rooms/guards';
import { saveMessage, broadcastMessage } from '$lib/server/rooms/send-message';
import { createOneToOneRoom } from '$lib/server/rooms/create-room';
import { leaveRoom } from '$lib/server/rooms/leave-room';
import { deleteRoom } from '$lib/server/rooms/delete-room';

export interface ChatService {
	sendMessage(params: { userId: string; roomId: string; content: string }): Promise<Message>;
	createRoom(userIdA: string, userIdB: string): Promise<Room>;
	leaveRoom(userId: string, roomId: string): Promise<void>;
	deleteRoom(userId: string, roomId: string): Promise<void>;
}

export function createChatService(deps: {
	db: Database;
	getIO: () => SocketIOServer;
}): ChatService {
	const { db, getIO } = deps;

	return {
		async sendMessage({ userId, roomId, content }) {
			await assertRoomMember(db, userId, roomId);
			const saved = await saveMessage(db, { roomId, senderId: userId, content });
			broadcastMessage(getIO(), roomId, saved);
			return saved;
		},

		async createRoom(userIdA, userIdB) {
			return createOneToOneRoom(db, userIdA, userIdB);
		},

		async leaveRoom(userId, roomId) {
			await assertRoomMember(db, userId, roomId);
			return leaveRoom(db, userId, roomId);
		},

		async deleteRoom(userId, roomId) {
			await assertRoomMember(db, userId, roomId);
			return deleteRoom(db, roomId);
		}
	};
}
