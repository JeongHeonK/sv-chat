import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { message, roomUser } from '$lib/server/db/chat.schema';
import { user } from '$lib/server/db/auth.schema';
import type { Database } from '$lib/server/db';

function escapeLikePattern(s: string): string {
	return s.replace(/[%_\\]/g, '\\$&');
}

export interface SearchResult {
	id: string;
	roomId: string;
	senderId: string;
	senderName: string;
	content: string;
	createdAt: Date;
}

export interface SearchMessagesResult {
	messages: SearchResult[];
	total: number;
}

interface SearchOptions {
	offset?: number;
	limit?: number;
}

const DEFAULT_LIMIT = 20;

export async function searchMessages(
	db: Database,
	userId: string,
	query: string,
	options?: SearchOptions
): Promise<SearchMessagesResult> {
	const offset = options?.offset ?? 0;
	const limit = options?.limit ?? DEFAULT_LIMIT;
	const pattern = `%${escapeLikePattern(query)}%`;

	// 사용자가 참여한 방의 roomId 서브쿼리
	const userRoomIds = db
		.select({ roomId: roomUser.roomId })
		.from(roomUser)
		.where(eq(roomUser.userId, userId));

	const baseConditions = and(
		ilike(message.content, pattern),
		sql`${message.roomId} in (${userRoomIds})`
	);

	// 총 개수 조회
	const countResult = await db
		.select({ count: sql<number>`cast(count(*) as integer)` })
		.from(message)
		.where(baseConditions);

	const total = countResult[0]?.count ?? 0;

	// 검색 결과 조회
	const rows = await db
		.select({
			id: message.id,
			roomId: message.roomId,
			senderId: message.senderId,
			senderName: user.name,
			content: message.content,
			createdAt: message.createdAt
		})
		.from(message)
		.innerJoin(user, eq(message.senderId, user.id))
		.where(baseConditions)
		.orderBy(desc(message.createdAt))
		.offset(offset)
		.limit(limit);

	return { messages: rows, total };
}
