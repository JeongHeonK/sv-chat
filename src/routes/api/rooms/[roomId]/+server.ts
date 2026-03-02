import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { assertRoomMember } from '$lib/server/rooms';
import { chatService } from '$lib/server/chat-service-instance';

/**
 * DELETE /api/rooms/[roomId]?action=leave — 채팅방 나가기
 * DELETE /api/rooms/[roomId]?action=delete — 채팅방 삭제
 *
 * 인증 필수. 채팅방 멤버여야 함.
 */
export const DELETE: RequestHandler = async (event) => {
	// 인증 확인
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = event.locals.user.id;
	const { roomId } = event.params;

	if (!roomId) {
		return json({ error: 'Invalid roomId' }, { status: 400 });
	}

	const action = event.url.searchParams.get('action');

	// 멤버십 확인
	try {
		await assertRoomMember(db, userId, roomId);
	} catch {
		return json({ error: 'Not a room member' }, { status: 403 });
	}

	try {
		if (action === 'delete') {
			await chatService.deleteRoom(userId, roomId);
		} else {
			// 기본값: leave
			await chatService.leaveRoom(userId, roomId);
		}
		return json({ success: true }, { status: 200 });
	} catch (err: unknown) {
		console.error(`Failed to ${action || 'leave'} room:`, err);
		return json({ error: `Failed to ${action || 'leave'} room` }, { status: 500 });
	}
};
