import { sql } from 'drizzle-orm';
import type { Server as SocketIOServer } from 'socket.io';
import { message, type Message } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';
import { SOCKET_EVENTS } from '$lib/server/socket/events';

interface SaveMessageParams {
	roomId: string;
	senderId: string;
	content: string;
}

export async function saveMessage(db: Database, params: SaveMessageParams): Promise<Message> {
	const id = crypto.randomUUID();
	const [saved] = await db
		.insert(message)
		.values({
			id,
			roomId: params.roomId,
			senderId: params.senderId,
			content: params.content,
			createdAt: sql`now()`
		})
		.returning();
	return saved;
}

export function broadcastMessage(io: SocketIOServer, roomId: string, msg: Message): void {
	io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_CREATED, msg);
}
