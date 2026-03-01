import { and, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { room, roomUser } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';

export async function assertRoomMember(
	db: Database,
	userId: string,
	roomId: string
): Promise<void> {
	const rooms = await db.select({ id: room.id }).from(room).where(eq(room.id, roomId)).limit(1);

	if (rooms.length === 0) {
		throw error(404, 'Room not found');
	}

	const membership = await db
		.select({ id: roomUser.id })
		.from(roomUser)
		.where(and(eq(roomUser.roomId, roomId), eq(roomUser.userId, userId)))
		.limit(1);

	if (membership.length === 0) {
		throw error(403, 'Not a room member');
	}
}
