import { eq, gt, sql, and } from 'drizzle-orm';
import { roomUser, message } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';

export interface UnreadCount {
	roomId: string;
	count: number;
}

export async function getUnreadCounts(db: Database, userId: string): Promise<UnreadCount[]> {
	const rows = await db
		.select({
			roomId: roomUser.roomId,
			count: sql<number>`cast(count(${message.id}) as integer)`
		})
		.from(roomUser)
		.leftJoin(
			message,
			and(eq(message.roomId, roomUser.roomId), gt(message.createdAt, roomUser.lastReadAt))
		)
		.where(eq(roomUser.userId, userId))
		.groupBy(roomUser.roomId);

	return rows;
}

export async function updateLastReadAt(
	db: Database,
	userId: string,
	roomId: string,
	timestamp?: Date
): Promise<void> {
	const readAt = timestamp ?? new Date();
	await db
		.update(roomUser)
		.set({ lastReadAt: readAt })
		.where(and(eq(roomUser.userId, userId), eq(roomUser.roomId, roomId)));
}
