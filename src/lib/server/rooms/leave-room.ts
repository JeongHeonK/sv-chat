import { and, eq, sql } from 'drizzle-orm';
import { room, roomUser } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';
import { getIO } from '$lib/server/socket/io';
import { SOCKET_EVENTS } from '$lib/socket-events';

/**
 * 채팅방에서 사용자를 제거함.
 * 남은 멤버가 있으면 room:left 이벤트 전송.
 * 남은 멤버가 없으면 room을 cascade 삭제함.
 */
export async function leaveRoom(db: Database, userId: string, roomId: string): Promise<void> {
	await db.transaction(async (tx) => {
		// 1. roomUser 레코드 삭제
		await tx.delete(roomUser).where(and(eq(roomUser.roomId, roomId), eq(roomUser.userId, userId)));

		// 2. 남은 멤버 수 확인
		const remaining = await tx
			.select({ count: sql<number>`cast(count(${roomUser.id}) as integer)` })
			.from(roomUser)
			.where(eq(roomUser.roomId, roomId));

		if (remaining[0]?.count === 0) {
			// 3a. 멤버가 0명이면 room 삭제 (cascade로 message도 자동 삭제)
			await tx.delete(room).where(eq(room.id, roomId));
		} else {
			// 3b. 남은 멤버에게 room:left 이벤트 전송
			const io = getIO();
			io.to(roomId).emit(SOCKET_EVENTS.ROOM_LEFT, { roomId, userId });
		}
	});
}
