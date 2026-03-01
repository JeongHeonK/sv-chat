import { eq, desc, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../db/schema';
import { room, roomUser, message } from '../db/chat.schema';
import { user } from '../db/auth.schema';

export interface RoomWithLastMessage {
	id: string;
	name: string;
	lastMessage: string | null;
	lastMessageAt: Date | null;
}

export async function getUserRooms(
	db: PostgresJsDatabase<typeof schema>,
	userId: string
): Promise<RoomWithLastMessage[]> {
	// 서브쿼리: ROW_NUMBER()로 방별 최신 메시지 1건 추출
	const rankedMessages = db
		.select({
			roomId: message.roomId,
			content: message.content,
			createdAt: message.createdAt,
			rn: sql<number>`row_number() over (partition by ${message.roomId} order by ${message.createdAt} desc)`.as(
				'rn'
			)
		})
		.from(message)
		.as('ranked_messages');

	const lastMessageSq = db
		.select({
			roomId: rankedMessages.roomId,
			content: rankedMessages.content,
			createdAt: rankedMessages.createdAt
		})
		.from(rankedMessages)
		.where(sql`${rankedMessages.rn} = 1`)
		.as('last_msg');

	// 유저가 참여한 방 + 상대방 정보 + 최신 메시지 JOIN
	const myRooms = db
		.select({
			id: room.id,
			name: user.name,
			lastMessage: lastMessageSq.content,
			lastMessageAt: lastMessageSq.createdAt
		})
		.from(roomUser)
		.innerJoin(room, eq(roomUser.roomId, room.id))
		.innerJoin(
			// 상대방 roomUser (나 제외)
			db
				.select({ roomId: roomUser.roomId, userId: roomUser.userId })
				.from(roomUser)
				.where(sql`${roomUser.userId} != ${userId}`)
				.as('other_ru'),
			sql`other_ru.room_id = ${roomUser.roomId}`
		)
		.innerJoin(user, sql`${user.id} = other_ru.user_id`)
		.leftJoin(lastMessageSq, sql`${lastMessageSq.roomId} = ${room.id}`)
		.where(eq(roomUser.userId, userId))
		.orderBy(desc(lastMessageSq.createdAt));

	return myRooms;
}
