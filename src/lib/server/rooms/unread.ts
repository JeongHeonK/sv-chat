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
	// 기본값: PostgreSQL NOW() 사용 — message.createdAt과 동일한 시간 소스로 정확한 비교 보장
	// timestamp 인자는 테스트 등에서 특정 시점을 지정할 때만 사용
	await db
		.update(roomUser)
		.set({ lastReadAt: timestamp ?? sql`NOW()` })
		.where(and(eq(roomUser.userId, userId), eq(roomUser.roomId, roomId)));
}
