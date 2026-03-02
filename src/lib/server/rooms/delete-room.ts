import { eq } from 'drizzle-orm';
import { room } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';
import { getIO } from '$lib/server/socket/io';
import { SOCKET_EVENTS } from '$lib/socket-events';

/**
 * 채팅방을 완전히 삭제함.
 * room cascade 삭제 시 roomUser, message도 자동 삭제.
 * 상대방에게 Socket 'room:deleted' 이벤트 전송.
 */
export async function deleteRoom(db: Database, roomId: string): Promise<void> {
	// 1. 삭제 전 Socket 이벤트 전송 (소켓 room에 아직 연결되어 있으므로)
	const io = getIO();
	io.to(roomId).emit(SOCKET_EVENTS.ROOM_DELETED, { roomId });

	// 2. room 삭제 (cascade로 roomUser, message 자동 삭제)
	await db.delete(room).where(eq(room.id, roomId));
}
